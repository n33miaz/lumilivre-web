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
  /** ms desde que entrou em "waking" (para exibir o tempo decorrido). */
  elapsedMs: number;
  /** Força um health-check imediato ("Tentar agora"). */
  retryNow: () => void;
}

const ApiHealthContext = createContext<ApiHealthContextType | undefined>(undefined);

const HEALTH_PATH = '/actuator/health';
// Backoff: 2s → 3s → 5s → 8s → 12s → 15s (cap). Cada tentativa tem timeout curto.
const BACKOFF = [2000, 3000, 5000, 8000, 12000, 15000];
// Após este teto sem sucesso, passa de "waking" para "down" (estado de erro).
const DOWN_THRESHOLD_MS = 3 * 60 * 1000;

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

  const timerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const wakingSinceRef = useRef<number | null>(null);
  const pollingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.get(HEALTH_PATH, { timeout: 5000 });
      const body = res.data as { status?: string } | undefined;
      return res.status === 200 && (body?.status ? body.status === 'UP' : true);
    } catch {
      return false;
    }
  }, []);

  const stopPolling = useCallback(() => {
    pollingRef.current = false;
    attemptRef.current = 0;
    wakingSinceRef.current = null;
    clearTimer();
  }, []);

  const poll = useCallback(async () => {
    if (!pollingRef.current) return;

    const ok = await checkHealth();
    if (!pollingRef.current) return;

    if (ok) {
      setStatus('up');
      setElapsedMs(0);
      stopPolling();
      // Retoma tudo: as queries que falharam durante o cold start são refeitas.
      queryClient.invalidateQueries();
      return;
    }

    const since = wakingSinceRef.current ?? Date.now();
    const elapsed = Date.now() - since;
    setElapsedMs(elapsed);
    setStatus(elapsed >= DOWN_THRESHOLD_MS ? 'down' : 'waking');

    const delay = BACKOFF[Math.min(attemptRef.current, BACKOFF.length - 1)];
    attemptRef.current += 1;
    clearTimer();
    timerRef.current = window.setTimeout(poll, delay);
  }, [checkHealth, stopPolling]);

  const beginWaking = useCallback(() => {
    if (pollingRef.current) return; // já monitorando
    pollingRef.current = true;
    attemptRef.current = 0;
    wakingSinceRef.current = Date.now();
    setStatus('waking');
    setElapsedMs(0);
    void poll();
  }, [poll]);

  const retryNow = useCallback(() => {
    if (!pollingRef.current) {
      beginWaking();
      return;
    }
    attemptRef.current = 0;
    clearTimer();
    void poll();
  }, [beginWaking, poll]);

  // Interceptor: classifica indisponibilidade (cold start) e NÃO desloga —
  // isso fica a cargo do AuthContext apenas para 401/403.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (response) => {
        if (pollingRef.current && !response.config?.url?.includes(HEALTH_PATH)) {
          // Uma resposta normal chegou: o servidor voltou.
          setStatus('up');
          setElapsedMs(0);
          stopPolling();
          queryClient.invalidateQueries();
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
  }, [beginWaking, stopPolling]);

  useEffect(() => () => clearTimer(), []);

  return (
    <ApiHealthContext.Provider value={{ status, elapsedMs, retryNow }}>
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
