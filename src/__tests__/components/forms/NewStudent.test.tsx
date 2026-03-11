import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { NovoAluno } from '../../../components/forms/NewStudent';
import { ToastProvider } from '../../../contexts/ToastContext';

// Mocks

vi.mock('../../../services/cepService', () => ({
  buscarEnderecoPorCep: vi.fn().mockResolvedValue({
    logradouro: 'Rua Teste',
    bairro: 'Bairro Mock',
    localidade: 'Cidade Falsa',
    uf: 'MF', // Mock Fake
  }),
}));

vi.mock('../../../hooks/useCommonQueries', () => ({
  useCursos: vi.fn().mockReturnValue({
    data: [{ id: 1, nome: 'Desenvolvimento de Sistemas' }],
  }),
  useModulos: vi.fn().mockReturnValue({ data: [{ id: 1, nome: '3º Módulo' }] }),
  useTurnos: vi.fn().mockReturnValue({ data: [{ id: 1, nome: 'Noite' }] }),
}));

const mockCreateStudent = vi.fn();
vi.mock('../../../hooks/mutations/useStudentMutations', () => ({
  useCreateStudent: vi.fn(() => ({
    mutateAsync: mockCreateStudent,
    isPending: false,
  })),
}));

// Setup do Wrapper com todos os providers necessários
const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>{children}</ToastProvider>
  </QueryClientProvider>
);

describe('Formulário: NovoAluno', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateStudent.mockResolvedValue({});
  });

  it('deve preencher o formulário, submeter e chamar a mutação com os dados corretos', async () => {
    // Renderizar o componente
    render(<NovoAluno onClose={mockOnClose} />, { wrapper });

    // Simular a interação do usuário (preenchimento dos campos)
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
      target: { value: 'João da Silva' },
    });
    fireEvent.change(screen.getByLabelText(/Matrícula/i), {
      target: { value: '24777' },
    });
    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'joao.silva@email.com' },
    });

    // Clicar nos selects para abrir as opções
    fireEvent.click(screen.getByText('Selecione o Curso'));
    // Clicar na opção que aparece
    await screen.findByText('Desenvolvimento de Sistemas');
    fireEvent.click(screen.getByText('Desenvolvimento de Sistemas'));

    fireEvent.click(screen.getByText('Selecione o Turno'));
    await screen.findByText('Noite');
    fireEvent.click(screen.getByText('Noite'));

    fireEvent.click(screen.getByText('Selecione o Módulo'));
    await screen.findByText('3º Módulo');
    fireEvent.click(screen.getByText('3º Módulo'));

    // Simular o envio do formulário
    const submitButton = screen.getByRole('button', {
      name: /cadastrar aluno/i,
    });
    fireEvent.click(submitButton);

    // Assert (Verificar o resultado)
    await waitFor(() => {
      // A mutação foi chamada?
      expect(mockCreateStudent).toHaveBeenCalledTimes(1);

      // Foi chamada com os dados que o usuário digitou?
      expect(mockCreateStudent).toHaveBeenCalledWith(
        expect.objectContaining({
          nomeCompleto: 'João da Silva',
          matricula: '24777',
          email: 'joao.silva@email.com',
          cursoId: 1,
          turnoId: 1,
          moduloId: 1,
        }),
      );
    });

    // O modal foi fechado após o sucesso?
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
