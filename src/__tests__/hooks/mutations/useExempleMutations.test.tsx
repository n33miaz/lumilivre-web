import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import {
  useCreateExemple,
  useUpdateExemplar,
  useDeleteExemplar,
} from '../../../hooks/mutations/useExempleMutations';
import * as exemplarService from '../../../services/exemplarService';

vi.mock('../../../services/exemplarService');
const mockedCadastrar = vi.mocked(exemplarService.cadastrarExemplar);
const mockedAtualizar = vi.mocked(exemplarService.atualizarExemplar);
const mockedExcluir = vi.mocked(exemplarService.excluirExemplar);

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

describe('useCreateExemple', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve cadastrar exemplar e exibir toast de sucesso', async () => {
    mockedCadastrar.mockResolvedValue({ tombo: 'T001' });

    const { result } = renderHook(() => useCreateExemple(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      tombo: 'T001',
      livro_id: 1,
      status_livro: 'DISPONIVEL',
      localizacao_fisica: 'Estante A',
    });

    await waitFor(() => {
      expect(mockedCadastrar).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Exemplar cadastrado com sucesso!',
        }),
      );
    });
  });

  it('deve exibir toast de erro ao falhar', async () => {
    mockedCadastrar.mockRejectedValue(new Error('Tombo já existe'));

    const { result } = renderHook(() => useCreateExemple(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync({
        tombo: 'T001',
        livro_id: 1,
        status_livro: 'DISPONIVEL',
        localizacao_fisica: 'Estante A',
      });
    } catch {
      // erro esperado
    }

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
    });
  });
});

describe('useUpdateExemplar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar exemplar com sucesso', async () => {
    mockedAtualizar.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useUpdateExemplar(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      tomboAtual: 'T001',
      payload: {
        tombo: 'T001-UPD',
        localizacao_fisica: 'Estante B',
        livro_id: 1,
        status_livro: 'DISPONIVEL',
      },
    });

    await waitFor(() => {
      expect(mockedAtualizar).toHaveBeenCalledWith(
        'T001',
        expect.objectContaining({ tombo: 'T001-UPD' }),
      );
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });
  });
});

describe('useDeleteExemplar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve excluir exemplar com sucesso', async () => {
    mockedExcluir.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useDeleteExemplar(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ tombo: 'T001', livroId: 1 });

    await waitFor(() => {
      expect(mockedExcluir).toHaveBeenCalledWith('T001');
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Exemplar excluído com sucesso!',
        }),
      );
    });
  });
});
