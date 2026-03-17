import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  it('deve fornecer a função addToast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.addToast).toBeDefined();
    expect(typeof result.current.addToast).toBe('function');
  });

  it('deve fornecer a função removeToast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.removeToast).toBeDefined();
    expect(typeof result.current.removeToast).toBe('function');
  });

  it('deve adicionar toast sem lançar erro', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    expect(() => {
      act(() => {
        result.current.addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Operação concluída.',
        });
      });
    }).not.toThrow();
  });

  it('deve aceitar todos os tipos de toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    const types = ['success', 'error', 'warning', 'info'] as const;

    types.forEach((type) => {
      expect(() => {
        act(() => {
          result.current.addToast({
            type,
            title: `Toast ${type}`,
            description: `Descrição ${type}`,
          });
        });
      }).not.toThrow();
    });
  });

  it('deve retornar objeto sem funções reais quando usado fora do Provider', () => {
    // O ToastContext tem um defaultValue ({} as ToastContextData),
    // então não lança erro fora do Provider — retorna o objeto vazio.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useToast());

    // Fora do Provider, as funções não existem no objeto default
    expect(result.current.addToast).toBeUndefined();
    expect(result.current.removeToast).toBeUndefined();

    consoleSpy.mockRestore();
  });
});
