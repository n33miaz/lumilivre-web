import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useCreateStudent } from '../../../hooks/mutations/useStudentMutations';
import * as alunoService from '../../../services/studentService';
import type { AlunoPayload } from '../../../services/studentService';

vi.mock('../../../services/studentService');
const mockedCadastrarAluno = vi.mocked(alunoService.cadastrarAluno);

const mockAddToast = vi.fn();
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Hook de Mutação: useCreateStudent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAlunoPayload = {
    nomeCompleto: 'Aluno de Teste',
    matricula: '12345',
    email: 'teste@email.com',
    cursoId: 1,
    turnoId: 1,
    moduloId: 1,
  } as AlunoPayload;

  it('deve chamar a API e exibir um toast de sucesso ao criar um aluno', async () => {
    mockedCadastrarAluno.mockResolvedValue({ id: 1, ...mockAlunoPayload });

    const { result } = renderHook(() => useCreateStudent(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(mockAlunoPayload);

    await waitFor(() => {
      expect(mockedCadastrarAluno).toHaveBeenCalledWith(mockAlunoPayload);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Aluno cadastrado com sucesso!',
        }),
      );
    });
  });

  it('deve exibir um toast de erro se a chamada da API falhar', async () => {
    const errorMessage = 'Matrícula já existe';
    mockedCadastrarAluno.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useCreateStudent(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync(mockAlunoPayload);
    } catch {
      // O erro é esperado e capturado, o teste pode continuar
    }

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Erro',
          description: errorMessage,
        }),
      );
    });
  });
});
