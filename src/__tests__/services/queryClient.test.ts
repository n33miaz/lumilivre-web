import { describe, it, expect } from 'vitest';
import { queryClient } from '../../services/queryClient';

describe('queryClient', () => {
  it('deve estar configurado com staleTime de 5 minutos', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(1000 * 60 * 5);
  });

  it('deve estar configurado com gcTime de 30 minutos', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.gcTime).toBe(1000 * 60 * 30);
  });

  it('deve ter refetchOnWindowFocus desabilitado', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('não repete erros 4xx (exceto 408/429)', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean;
    expect(typeof retry).toBe('function');

    expect(retry(0, { response: { status: 404 } })).toBe(false);
    expect(retry(0, { response: { status: 403 } })).toBe(false);
    expect(retry(0, { response: { status: 429 } })).toBe(true);
    expect(retry(0, { response: { status: 408 } })).toBe(true);
  });

  it('repete rede/5xx até 4 tentativas (cold start)', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean;

    expect(retry(0, new Error('Network Error'))).toBe(true);
    expect(retry(3, { response: { status: 503 } })).toBe(true);
    expect(retry(4, { response: { status: 503 } })).toBe(false);
  });
});
