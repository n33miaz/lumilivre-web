import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useCreateTcc, useUpdateTcc, useDeleteTcc } from '../../../hooks/mutations/useTccMutations';
import * as tccService from '../../../services/tccService';

vi.mock('../../../services/tccService');
const mockedCadastrar = vi.mocked(tccService.cadastrarTcc);
const mockedAtualizar = vi.mocked(tccService.atualizarTcc);
const mockedExcluir = vi.mocked(tccService.excluirTcc);

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

const mockPayload: tccService.TccPayload = {
  titulo: 'TCC de Teste',
  alunos: 'Aluno A, Aluno B',
  orientadores: 'Prof. C',
  curso_id: 1,
  anoConclusao: '2025',
  semestreConclusao: '2',
  linkExterno: '',
  ativo: true,
};

describe('useCreateTcc', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve cadastrar TCC e exibir toast de sucesso', async () => {
    mockedCadastrar.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => useCreateTcc(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ payload: mockPayload });

    await waitFor(() => {
      expect(mockedCadastrar).toHaveBeenCalledWith(mockPayload, undefined, undefined);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', description: 'TCC cadastrado com sucesso!' }),
      );
    });
  });

  it('deve exibir toast de erro ao falhar', async () => {
    mockedCadastrar.mockRejectedValue(new Error('Erro'));

    const { result } = renderHook(() => useCreateTcc(), { wrapper: createWrapper() });

    try {
      await result.current.mutateAsync({ payload: mockPayload });
    } catch {
      // erro esperado
    }

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });
});

describe('useUpdateTcc', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar TCC com sucesso', async () => {
    mockedAtualizar.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useUpdateTcc(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 1, payload: mockPayload });

    await waitFor(() => {
      expect(mockedAtualizar).toHaveBeenCalledWith(1, mockPayload, undefined, undefined);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', description: 'TCC atualizado com sucesso!' }),
      );
    });
  });
});

describe('useDeleteTcc', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve excluir TCC com sucesso', async () => {
    mockedExcluir.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useDeleteTcc(), { wrapper: createWrapper() });

    await result.current.mutateAsync(10);

    await waitFor(() => {
      expect(mockedExcluir).toHaveBeenCalledWith(10);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', description: 'TCC excluído com sucesso!' }),
      );
    });
  });
});
