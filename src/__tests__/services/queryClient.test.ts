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

  it('deve ter retry configurado como 1', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
  });
});
