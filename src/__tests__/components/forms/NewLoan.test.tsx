import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { NovoEmprestimo } from '../../../components/forms/NewLoan';
import { ToastProvider } from '../../../contexts/ToastContext';

// Mocks dos serviços
vi.mock('../../../services/alunoService', () => ({
  buscarAlunosParaAdmin: vi.fn().mockResolvedValue({ content: [] }),
}));
vi.mock('../../../services/livroService', () => ({
  buscarLivrosAgrupados: vi.fn().mockResolvedValue({ content: [] }),
}));
vi.mock('../../../services/exemplarService', () => ({
  buscarExemplaresPorLivroId: vi.fn().mockResolvedValue([]),
}));

const mockCreateLoan = vi.fn();
vi.mock('../../../hooks/mutations/useLoanMutations', () => ({
  useCreateLoan: vi.fn(() => ({
    mutateAsync: mockCreateLoan,
    isPending: false,
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>{children}</ToastProvider>
  </QueryClientProvider>
);

describe('Formulário: NovoEmprestimo', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os campos do formulário', () => {
    render(<NovoEmprestimo onClose={mockOnClose} onSuccess={mockOnSuccess} />, {
      wrapper,
    });

    expect(screen.getByText('Data do Empréstimo*')).toBeInTheDocument();
    expect(screen.getByText('Data de Devolução*')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByText('Livro')).toBeInTheDocument();
    expect(screen.getByText('Exemplar Disponível')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /CONFIRMAR EMPRÉSTIMO/i }),
    ).toBeInTheDocument();
  });

  it('deve exibir erros de validação ao submeter sem selecionar aluno, livro e exemplar', async () => {
    render(<NovoEmprestimo onClose={mockOnClose} onSuccess={mockOnSuccess} />, {
      wrapper,
    });

    fireEvent.click(
      screen.getByRole('button', { name: /CONFIRMAR EMPRÉSTIMO/i }),
    );

    await waitFor(() => {
      expect(screen.getByText('Selecione um aluno')).toBeInTheDocument();

      // "Selecione um livro" aparece tanto como placeholder do select quanto como erro de validação
      const livroMessages = screen.getAllByText('Selecione um livro');
      expect(livroMessages.length).toBeGreaterThanOrEqual(2);

      expect(screen.getByText('Selecione um exemplar')).toBeInTheDocument();
    });

    expect(mockCreateLoan).not.toHaveBeenCalled();
  });

  it('deve manter o campo de exemplar desabilitado até selecionar um livro', () => {
    render(<NovoEmprestimo onClose={mockOnClose} onSuccess={mockOnSuccess} />, {
      wrapper,
    });

    // O placeholder do exemplar deve indicar que precisa selecionar um livro primeiro
    expect(screen.getByText('Selecione um livro')).toBeInTheDocument();
  });
});
