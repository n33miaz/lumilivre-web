import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { NovoLivro } from '../../../components/forms/NewBook';
import { ToastProvider } from '../../../contexts/ToastContext';

// Mocks
vi.mock('../../../services/livroService', () => ({
  buscarLivrosParaAdmin: vi.fn().mockResolvedValue({ content: [] }),
}));

vi.mock('../../../hooks/useCommonQueries', () => ({
  useCdds: vi.fn().mockReturnValue({ data: [] }),
  useGeneros: vi.fn().mockReturnValue({ data: [] }),
  useEnum: vi.fn().mockReturnValue({ data: [] }),
}));

const mockCreateBook = vi.fn();
vi.mock('../../../hooks/mutations/useBookMutations', () => ({
  useCreateBook: vi.fn(() => ({
    mutateAsync: mockCreateBook,
    isPending: false,
  })),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>{children}</ToastProvider>
  </QueryClientProvider>
);

describe('Formulário: NovoLivro', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir erros de validação ao tentar submeter o formulário vazio', async () => {
    render(<NovoLivro onClose={mockOnClose} onSuccess={mockOnSuccess} />, {
      wrapper,
    });

    // Tenta submeter sem preencher nada
    fireEvent.click(screen.getByRole('button', { name: /CADASTRAR LIVRO/i }));

    // Verifica se as mensagens de erro do Zod apareceram na tela
    await waitFor(() => {
      expect(
        screen.getByText('ISBN deve ter no mínimo 10 caracteres'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('O título do livro é obrigatório'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Selecione ao menos um gênero'),
      ).toBeInTheDocument();
    });

    // Garante que a API não foi chamada
    expect(mockCreateBook).not.toHaveBeenCalled();
  });
});
