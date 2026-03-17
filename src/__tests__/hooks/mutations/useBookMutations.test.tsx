import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useCreateBook, useUpdateBook, useDeleteBook } from '../../../hooks/mutations/useBookMutations';
import * as livroService from '../../../services/livroService';

vi.mock('../../../services/livroService');
const mockedCadastrar = vi.mocked(livroService.cadastrarLivro);
const mockedAtualizar = vi.mocked(livroService.atualizarLivro);
const mockedExcluir = vi.mocked(livroService.excluirLivroComExemplares);

const mockAddToast = vi.fn();
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockPayload: livroService.LivroPayload = {
  isbn: '9788535914849',
  nome: 'Dom Casmurro',
  data_lancamento: '1899-01-01',
  numero_paginas: 256,
  cdd: '869',
  editora: 'Companhia das Letras',
  classificacao_etaria: 'LIVRE',
  tipo_capa: 'BROCHURA',
  generos: ['Romance'],
  autor: 'Machado de Assis',
};

describe('useCreateBook', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve cadastrar livro e exibir toast de sucesso', async () => {
    mockedCadastrar.mockResolvedValue({ isbn: '9788535914849' });

    const { result } = renderHook(() => useCreateBook(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ payload: mockPayload });

    await waitFor(() => {
      expect(mockedCadastrar).toHaveBeenCalledWith(mockPayload, undefined);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', description: 'Livro cadastrado com sucesso!' }),
      );
    });
  });

  it('deve exibir toast de erro ao falhar', async () => {
    mockedCadastrar.mockRejectedValue(new Error('ISBN duplicado'));

    const { result } = renderHook(() => useCreateBook(), { wrapper: createWrapper() });

    try {
      await result.current.mutateAsync({ payload: mockPayload });
    } catch {
      // erro esperado
    }

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', title: 'Erro' }),
      );
    });
  });
});

describe('useUpdateBook', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar livro e exibir toast de sucesso', async () => {
    mockedAtualizar.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useUpdateBook(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 1, payload: mockPayload });

    await waitFor(() => {
      expect(mockedAtualizar).toHaveBeenCalledWith(1, mockPayload, undefined);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', description: 'Livro atualizado com sucesso!' }),
      );
    });
  });
});

describe('useDeleteBook', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve excluir livro e exibir toast de sucesso', async () => {
    mockedExcluir.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useDeleteBook(), { wrapper: createWrapper() });

    await result.current.mutateAsync('9788535914849');

    await waitFor(() => {
      expect(mockedExcluir).toHaveBeenCalledWith('9788535914849');
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', description: 'Livro e seus exemplares foram excluídos!' }),
      );
    });
  });
});
