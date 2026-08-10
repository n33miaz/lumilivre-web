import { act, render, screen } from '@testing-library/react';
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '../../services/api';
import {
  ApiHealthProvider,
  useApiHealth,
} from '../../contexts/ApiHealthContext';

/**
 * O bug que originou isto: com a API fora do ar o usuário não via nada. A
 * suíte cobre o caminho inteiro — a falha vira episódio, o episódio fica calado
 * na carência, depois acende o aviso discreto, depois o modal; fechar o modal
 * não o traz de volta; e a volta da API limpa tudo.
 */

const HEALTH_PATH = '/actuator/health';

let serverUp = false;
let healthCalls = 0;
let failureCode = 'ERR_NETWORK';

const adapter = (async (config: InternalAxiosRequestConfig) => {
  if (config.url?.includes(HEALTH_PATH)) healthCalls += 1;

  if (!serverUp) {
    // O mesmo formato do cold start: sem resposta e com código de rede.
    throw new AxiosError('Network Error', failureCode, config);
  }

  return {
    data: { status: 'UP' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}) as AxiosAdapter;

function Probe() {
  const { status, elapsedMs, noticeVisible, modalVisible, dismissModal } =
    useApiHealth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="elapsed">{elapsedMs}</span>
      <span data-testid="notice">{String(noticeVisible)}</span>
      <span data-testid="modal">{String(modalVisible)}</span>
      <button type="button" onClick={dismissModal}>
        fechar
      </button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <ApiHealthProvider>
      <Probe />
    </ApiHealthProvider>,
  );

/** Avança o relógio deixando as promessas do axios resolverem no caminho. */
const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const read = (id: string) => screen.getByTestId(id).textContent;

describe('ApiHealthContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.defaults.adapter = adapter;
    serverUp = false;
    healthCalls = 0;
    failureCode = 'ERR_NETWORK';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não mostra nada quando a API responde', async () => {
    serverUp = true;
    renderProvider();
    await advance(0);

    expect(read('status')).toBe('up');
    expect(read('notice')).toBe('false');
    expect(read('modal')).toBe('false');
  });

  it('a primeira falha começa o ciclo calado — sem aviso e sem modal', async () => {
    renderProvider();
    await advance(0);

    expect(read('status')).toBe('waking');
    expect(read('notice')).toBe('false');
    expect(read('modal')).toBe('false');
  });

  it('acende o aviso discreto na carência curta e o modal só bem depois', async () => {
    renderProvider();
    await advance(0);

    // Antes de 4s continua invisível: um 502 de passagem morre aqui.
    await advance(3000);
    expect(read('notice')).toBe('false');

    await advance(2000);
    expect(read('notice')).toBe('true');
    expect(read('modal')).toBe('false');

    // O modal só entra depois de 20s de espera confirmada.
    await advance(10_000);
    expect(read('modal')).toBe('false');

    await advance(6000);
    expect(read('modal')).toBe('true');
  });

  it('fechar o modal não o traz de volta no mesmo episódio, e o aviso permanece', async () => {
    renderProvider();
    await advance(25_000);
    expect(read('modal')).toBe('true');

    await act(async () => {
      screen.getByRole('button', { name: 'fechar' }).click();
    });

    expect(read('modal')).toBe('false');
    expect(read('notice')).toBe('true');

    // Minutos depois continua fechado.
    await advance(60_000);
    expect(read('modal')).toBe('false');
    expect(read('notice')).toBe('true');
  });

  it('passa de "waking" para "down" só depois do teto de 4 minutos', async () => {
    renderProvider();
    await advance(0);

    await advance(3 * 60_000 + 30_000);
    expect(read('status')).toBe('waking');

    await advance(45_000);
    expect(read('status')).toBe('down');
  });

  it('a volta da API apaga aviso, modal e contador', async () => {
    renderProvider();
    await advance(25_000);
    expect(read('modal')).toBe('true');

    serverUp = true;
    await advance(15_000);

    expect(read('status')).toBe('up');
    expect(read('elapsed')).toBe('0');
    expect(read('notice')).toBe('false');
    expect(read('modal')).toBe('false');
  });

  it('um episódio novo tem direito ao modal de novo, mesmo tendo sido fechado no anterior', async () => {
    renderProvider();
    await advance(25_000);
    await act(async () => {
      screen.getByRole('button', { name: 'fechar' }).click();
    });
    expect(read('modal')).toBe('false');

    serverUp = true;
    await advance(15_000);
    expect(read('status')).toBe('up');

    // Cai de novo: agora o modal pode voltar.
    serverUp = false;
    await act(async () => {
      await api.get('/api/books').catch(() => {});
    });
    await advance(25_000);

    expect(read('modal')).toBe('true');
  });

  it('aquece a API uma vez por carregamento e deduplica dentro da janela', async () => {
    serverUp = true;
    renderProvider();
    await advance(0);

    expect(healthCalls).toBe(1);

    // Voltar para a aba dentro da janela não vira sonda nova.
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(healthCalls).toBe(1);

    await advance(61_000);
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(0);
    expect(healthCalls).toBe(2);
  });

  it('o estouro do teto de uma chamada de tela abre o episódio', async () => {
    // Este é o caminho que estava morto: sem `timeout` no axios a requisição
    // ficava pendurada, nenhum erro era emitido e o interceptor nunca rodava.
    // Com o teto, a espera vira ECONNABORTED — e é isso que acende o aviso.
    serverUp = true;
    renderProvider();
    await advance(0);
    expect(read('status')).toBe('up');

    serverUp = false;
    failureCode = 'ECONNABORTED';
    await act(async () => {
      await api.get('/api/books').catch(() => {});
    });

    expect(read('status')).toBe('waking');
    expect(read('modal')).toBe('false');

    await advance(25_000);
    expect(read('modal')).toBe('true');
  });

  it('o aquecimento detecta a hibernação sem esperar uma chamada de tela falhar', async () => {
    renderProvider();
    await advance(0);

    // Ninguém pediu dado nenhum: só o ping de aquecimento rodou.
    expect(healthCalls).toBeGreaterThan(0);
    expect(read('status')).toBe('waking');
  });
});
