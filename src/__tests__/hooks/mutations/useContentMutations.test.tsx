import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import {
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
} from '../../../hooks/mutations/useContentMutations';
import * as contentService from '../../../services/contentService';

vi.mock('../../../services/contentService');
const mockedCadastrar = vi.mocked(contentService.cadastrarConteudo);
const mockedAtualizar = vi.mocked(contentService.atualizarConteudo);
const mockedExcluir = vi.mocked(contentService.excluirConteudo);

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

const mockPayload: contentService.ContentPayload = {
  contentType: 'ANNOUNCEMENT',
  title: 'Comunicado de Teste',
  published: true,
  pinned: false,
  displayOrder: 0,
  audienceScope: 'ALL',
};

const asResponse = (o: object) =>
  o as unknown as contentService.ContentResponse;

describe('useCreateContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve publicar conteúdo e exibir toast de sucesso', async () => {
    mockedCadastrar.mockResolvedValue(asResponse({ id: 'c1' }));

    const { result } = renderHook(() => useCreateContent(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ payload: mockPayload });

    await waitFor(() => {
      expect(mockedCadastrar).toHaveBeenCalledWith(mockPayload, undefined, undefined);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Conteúdo publicado com sucesso!',
        }),
      );
    });
  });

  it('deve exibir toast de erro ao falhar', async () => {
    mockedCadastrar.mockRejectedValue(new Error('Erro'));

    const { result } = renderHook(() => useCreateContent(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync({ payload: mockPayload });
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

describe('useUpdateContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar conteúdo com sucesso', async () => {
    mockedAtualizar.mockResolvedValue(asResponse({ id: 'c1' }));

    const { result } = renderHook(() => useUpdateContent(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ id: 'c1', payload: mockPayload });

    await waitFor(() => {
      expect(mockedAtualizar).toHaveBeenCalledWith('c1', mockPayload, undefined, undefined);
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Conteúdo atualizado com sucesso!',
        }),
      );
    });
  });
});

describe('useDeleteContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deve excluir conteúdo com sucesso', async () => {
    mockedExcluir.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useDeleteContent(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('c10');

    await waitFor(() => {
      expect(mockedExcluir).toHaveBeenCalledWith('c10');
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          description: 'Conteúdo excluído com sucesso!',
        }),
      );
    });
  });
});
