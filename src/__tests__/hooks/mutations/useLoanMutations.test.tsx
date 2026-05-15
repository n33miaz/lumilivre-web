import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import {
  useCreateLoan,
  useCompleteLoan,
  useDeleteLoan,
} from '../../../hooks/mutations/useLoanMutations';
import * as emprestimoService from '../../../services/loanService';

vi.mock('../../../services/loanService');
const mockedCadastrar = vi.mocked(emprestimoService.cadastrarEmprestimo);
const mockedConcluir = vi.mocked(emprestimoService.concluirEmprestimo);
const mockedExcluir = vi.mocked(emprestimoService.excluirEmprestimo);

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

const mockPayload = {
  aluno_matricula: '12345',
  exemplar_tombo: 'T001',
  data_emprestimo: '11/03/2026 10:00:00',
  data_devolucao: '18/03/2026 10:00:00',
};

describe('Hook: useCreateLoan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve cadastrar empréstimo e exibir toast de sucesso', async () => {
    mockedCadastrar.mockResolvedValue({ id: 1, ...mockPayload });

    const { result } = renderHook(() => useCreateLoan(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(mockPayload);

    await waitFor(() => {
      expect(mockedCadastrar).toHaveBeenCalledWith(mockPayload);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Empréstimo realizado com sucesso!',
        }),
      );
    });
  });

  it('deve exibir toast de erro ao falhar no cadastro', async () => {
    mockedCadastrar.mockRejectedValue(new Error('Aluno com penalidade'));

    const { result } = renderHook(() => useCreateLoan(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync(mockPayload);
    } catch {
      // erro esperado
    }

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Erro',
        }),
      );
    });
  });
});

describe('Hook: useCompleteLoan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve concluir empréstimo e exibir toast de devolução', async () => {
    mockedConcluir.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useCompleteLoan(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(99);

    await waitFor(() => {
      expect(mockedConcluir).toHaveBeenCalledWith(99);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Devolução registrada com sucesso!',
        }),
      );
    });
  });
});

describe('Hook: useDeleteLoan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve excluir empréstimo e exibir toast de sucesso', async () => {
    mockedExcluir.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useDeleteLoan(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(42);

    await waitFor(() => {
      expect(mockedExcluir).toHaveBeenCalledWith(42);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Empréstimo excluído com sucesso!',
        }),
      );
    });
  });
});
