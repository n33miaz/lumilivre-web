import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useCreateReader } from '../../../hooks/mutations/useReaderMutations';
import * as leitorService from '../../../services/readerService';
import type { LeitorPayload } from '../../../services/readerService';

vi.mock('../../../services/readerService');
const mockedCadastrarLeitor = vi.mocked(leitorService.cadastrarLeitor);
const mockedUploadReaderAvatar = vi.mocked(leitorService.uploadReaderAvatar);

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

describe('Hook de Mutação: useCreateReader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLeitorPayload = {
    nomeCompleto: 'Leitor de Teste',
    matricula: '12345',
    email: 'teste@email.com',
    cursoId: 1,
    turnoId: 1,
    moduloId: 1,
  } as LeitorPayload;

  it('deve chamar a API e exibir um toast de sucesso ao criar um leitor', async () => {
    mockedCadastrarLeitor.mockResolvedValue({ id: 1, ...mockLeitorPayload });

    const { result } = renderHook(() => useCreateReader(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ payload: mockLeitorPayload });

    await waitFor(() => {
      expect(mockedCadastrarLeitor).toHaveBeenCalledWith(mockLeitorPayload);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Leitor cadastrado com sucesso.',
        }),
      );
    });
  });

  it('deve encadear o upload do avatar quando um arquivo é enviado', async () => {
    mockedCadastrarLeitor.mockResolvedValue({ id: 1, ...mockLeitorPayload });
    mockedUploadReaderAvatar.mockResolvedValue(undefined as never);
    const avatarFile = new File(['x'], 'foto.png', { type: 'image/png' });

    const { result } = renderHook(() => useCreateReader(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ payload: mockLeitorPayload, avatarFile });

    await waitFor(() => {
      expect(mockedUploadReaderAvatar).toHaveBeenCalledWith(
        mockLeitorPayload.matricula,
        avatarFile,
      );
    });
  });

  it('deve exibir um toast de erro se a chamada da API falhar', async () => {
    const errorMessage = 'Matrícula já existe';
    mockedCadastrarLeitor.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useCreateReader(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync({ payload: mockLeitorPayload });
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
