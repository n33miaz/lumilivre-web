import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AxiosError } from 'axios';

import api from '../services/api';
import { queryClient } from '../services/queryClient';

export type ApiHealthStatus = 'up' | 'waking' | 'down';

interface ApiHealthContextType {
  status: ApiHealthStatus;
  /** ms desde o começo do episódio de indisponibilidade. */
  elapsedMs: number;
  /** O aviso permanente e discreto já passou da carência? */
  noticeVisible: boolean;
  /** O modal de explicação deve estar na tela? */
  modalVisible: boolean;
  /** Fecha o modal até o fim deste episódio (não reabre sozinho). */
  dismissModal: () => void;
  /** Força um health-check imediato ("Tentar agora"). */
  retryNow: () => void;
  /** Ping único e não-bloqueante para tirar a instância da hibernação. */
  warmUp: () => void;
}

const ApiHealthContext = createContext<ApiHealthContextType | undefined>(undefined);

const HEALTH_PATH = '/actuator/health';

/**
 * Teto próprio da sonda, bem abaixo do padrão do axios: ela não é uma chamada
 * de tela, é um diagnóstico. Esperar 20s por cada sonda atrasaria tanto o
 * primeiro veredito quanto a percepção de que o servidor voltou.
 */
const HEALTH_TIMEOUT_MS = 8000;

/**
 * Espera ENTRE sondas. Durante o cold start a instância não responde, então
 * cada sonda já custa os 8s do timeout acima — o intervalo efetivo é
 * sonda + espera. Por isso o teto é 8s e não os 15s de antes: mantém a
 * detecção do retorno abaixo de ~16s sem transformar a espera numa saraivada
 * de requisições.
 */
const BACKOFF = [1500, 3000, 5000, 8000];

/**
 * Depois deste teto sem sucesso o estado deixa de ser "está subindo" e passa a
 * ser "não subiu" (erro). Eram 3 minutos — abaixo do cold start real medido no
 * plano free do Render (~190s), então o caminho honesto de hibernação virava
 * mensagem de erro justamente no minuto em que a API ia voltar. 4 minutos deixa
 * ~50s de folga sobre o pior caso conhecido.
 */
const DOWN_THRESHOLD_MS = 4 * 60 * 1000;

/**
 * Carência do aviso discreto. Uma falha isolada (um 502 de proxy, um segundo
 * de Wi-Fi ruim) morre nas duas primeiras sondas do backoff, que acontecem
 * dentro dos primeiros ~4s. Antes desse prazo nada aparece na tela: o ciclo de
 * health-check começa calado.
 */
const NOTICE_AFTER_MS = 4000;

/**
 * Carência do modal. O modal interrompe, então só se justifica quando a espera
 * vai ser longa o bastante para a pessoa concluir que o sistema quebrou —
 * antes disso o aviso discreto já está na tela contando o tempo. 20s é cerca de
 * 10% do cold start medido: nenhuma instabilidade de rede sobrevive a 20s de
 * sondas com backoff, e quem passou desse ponto vai esperar minutos e merece a
 * explicação inteira.
 */
const MODAL_AFTER_MS = 20_000;

/** Cadência do contador de tempo decorrido mostrado ao usuário. */
const EPISODE_TICK_MS = 1000;

/**
 * Janela de deduplicação do aquecimento. O disparo é por carregamento, não por
 * navegação: sem esta janela, voltar para a aba várias vezes seguidas viraria
 * polling — exatamente o que não queremos fazer com uma instância que dorme
 * para economizar recurso.
 */
const WARM_UP_WINDOW_MS = 60_000;

function isUnavailabilityError(error: AxiosError): boolean {
  // Ignora o próprio health-check para não realimentar o ciclo.
  if (error.config?.url?.includes(HEALTH_PATH)) return false;
  const status = error.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;
  // Sem resposta = rede/timeout (cold start do Render).
  return (
    !error.response &&
    (error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error')
  );
}

export function ApiHealthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiHealthStatus>('up');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [modalDismissed, setModalDismissed] = useState(false);

  const timerRef = useRef<number | null>(null);
  const tickerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const wakingSinceRef = useRef<number | null>(null);
  const pollingRef = useRef(false);
  const lastWarmUpRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearTicker = () => {
    if (tickerRef.current !== null) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  };

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.get(HEALTH_PATH, { timeout: HEALTH_TIMEOUT_MS });
      const body = res.data as { status?: string } | undefined;
      return res.status === 200 && (body?.status ? body.status === 'UP' : true);
    } catch {
      return false;
    }
  }, []);

  /**
   * O relógio do episódio. Fica aqui, e não no componente do aviso, porque os
   * dois avisos nascem DEPOIS do começo da indisponibilidade: um contador que
   * arrancasse na montagem do componente mostraria "0s" quando a pessoa já
   * está esperando há meio minuto.
   */
  const startTicker = useCallback(() => {
    clearTicker();
    tickerRef.current = window.setInterval(() => {
      const since = wakingSinceRef.current;
      if (since === null) return;
      const elapsed = Date.now() - since;
      setElapsedMs(elapsed);
      if (elapsed >= DOWN_THRESHOLD_MS) setStatus('down');
    }, EPISODE_TICK_MS);
  }, []);

  const stopPolling = useCallback(() => {
    pollingRef.current = false;
    attemptRef.current = 0;
    wakingSinceRef.current = null;
    clearTimer();
    clearTicker();
  }, []);

  const recover = useCallback(() => {
    setStatus('up');
    setElapsedMs(0);
    // O episódio acabou: uma queda nova volta a ter direito ao modal.
    setModalDismissed(false);
    stopPolling();
    // Retoma tudo: as queries que falharam durante o cold start são refeitas.
    queryClient.invalidateQueries();
  }, [stopPolling]);

  const poll = useCallback(async () => {
    if (!pollingRef.current) return;

    const ok = await checkHealth();
    if (!pollingRef.current) return;

    if (ok) {
      recover();
      return;
    }

    const delay = BACKOFF[Math.min(attemptRef.current, BACKOFF.length - 1)];
    attemptRef.current += 1;
    clearTimer();
    timerRef.current = window.setTimeout(poll, delay);
  }, [checkHealth, recover]);

  const beginWaking = useCallback(() => {
    if (pollingRef.current) return; // já monitorando
    pollingRef.current = true;
    attemptRef.current = 0;
    wakingSinceRef.current = Date.now();
    setStatus('waking');
    setElapsedMs(0);
    setModalDismissed(false);
    startTicker();
    void poll();
  }, [poll, startTicker]);

  const dismissModal = useCallback(() => setModalDismissed(true), []);

  const retryNow = useCallback(() => {
    if (!pollingRef.current) {
      beginWaking();
      return;
    }
    attemptRef.current = 0;
    clearTimer();
    void poll();
  }, [beginWaking, poll]);

  /**
   * Aquecimento: uma sonda só, disparada quando a pessoa chega em qualquer
   * superfície do sistema. Serve a dois propósitos de uma vez — começa o cold
   * start antes de alguém precisar dos dados, e é o detector mais rápido que
   * temos, porque descobre a hibernação sem esperar a primeira chamada de tela
   * falhar.
   */
  const warmUp = useCallback(() => {
    if (pollingRef.current) return; // já estamos sondando; o ciclo cuida
    const now = Date.now();
    if (now - lastWarmUpRef.current < WARM_UP_WINDOW_MS) return;
    lastWarmUpRef.current = now;
    void checkHealth().then((ok) => {
      if (!ok) beginWaking();
    });
  }, [checkHealth, beginWaking]);

  // Interceptor: classifica indisponibilidade (cold start) e NÃO desloga —
  // isso fica a cargo do AuthContext apenas para 401/403.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (response) => {
        if (pollingRef.current && !response.config?.url?.includes(HEALTH_PATH)) {
          // Uma resposta normal chegou: o servidor voltou.
          recover();
        }
        return response;
      },
      (error: AxiosError) => {
        if (isUnavailabilityError(error)) {
          beginWaking();
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [beginWaking, recover]);

  // Um disparo por carregamento (o provider monta uma vez, então navegar entre
  // rotas não repete) e um a cada volta para a aba — é aí que mora o caso do
  // relato: a aba fica aberta, a instância dorme por inatividade, e a pessoa
  // volta para uma tela que parece viva. A janela de deduplicação impede que
  // alternar de aba vire sonda atrás de sonda; no StrictMode ela também absorve
  // a segunda execução do efeito, porque o ref sobrevive à remontagem simulada.
  useEffect(() => {
    warmUp();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') warmUp();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [warmUp]);

  useEffect(
    () => () => {
      clearTimer();
      clearTicker();
    },
    [],
  );

  const episodeOpen = status !== 'up';

  return (
    <ApiHealthContext.Provider
      value={{
        status,
        elapsedMs,
        noticeVisible: episodeOpen && elapsedMs >= NOTICE_AFTER_MS,
        modalVisible:
          episodeOpen && !modalDismissed && elapsedMs >= MODAL_AFTER_MS,
        dismissModal,
        retryNow,
        warmUp,
      }}
    >
      {children}
    </ApiHealthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApiHealth = () => {
  const ctx = useContext(ApiHealthContext);
  if (ctx === undefined) {
    throw new Error('useApiHealth must be used within an ApiHealthProvider');
  }
  return ctx;
};
