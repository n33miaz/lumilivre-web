import { beforeEach, describe, expect, it } from 'vitest';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

import api, { DEFAULT_TIMEOUT_MS, LONG_TIMEOUT_MS } from '../../services/api';

/**
 * O que estas asserções protegem: uma instância sem `timeout` deixa a
 * requisição pendurada quando a API está hibernando, nenhum erro é emitido e o
 * aviso de "servidor reativando" nunca chega à tela. E o teto que resolve isso
 * não pode cortar relatório nem upload, que demoram por natureza.
 */

const sent: InternalAxiosRequestConfig[] = [];

api.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
  sent.push(config);
  return {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}) as AxiosAdapter;

const lastTimeout = () => sent[sent.length - 1]?.timeout;

describe('services/api', () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it('aplica o teto padrão a uma chamada de tela', async () => {
    await api.get('/api/books');

    expect(lastTimeout()).toBe(DEFAULT_TIMEOUT_MS);
  });

  it('alarga o teto para download de arquivo', async () => {
    await api.get('/api/reports/loans', { responseType: 'blob' });

    expect(lastTimeout()).toBe(LONG_TIMEOUT_MS);
  });

  it('alarga o teto para upload multipart', async () => {
    const body = new FormData();
    body.append('file', new Blob(['capa']), 'capa.png');

    await api.post('/api/books/1/cover', body);

    expect(lastTimeout()).toBe(LONG_TIMEOUT_MS);
  });

  it('respeita o teto pedido por quem chamou', async () => {
    await api.get('/actuator/health', { timeout: 8000 });
    expect(lastTimeout()).toBe(8000);

    // Mesmo numa chamada longa: quem foi explícito manda.
    await api.get('/api/reports/books', { responseType: 'blob', timeout: 5000 });
    expect(lastTimeout()).toBe(5000);
  });

  it('mantém o cabeçalho de canal da auditoria', async () => {
    await api.get('/api/books');

    expect(sent[0].headers['X-Client']).toBe('WEB');
  });
});
