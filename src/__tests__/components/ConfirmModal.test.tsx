import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

describe('Componente ConfirmModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    // Limpa o histórico de chamadas das funções mockadas antes de cada teste
    vi.clearAllMocks();
  });

  it('deve renderizar o título e a mensagem corretamente', () => {
    // Arrange
    render(
      <ConfirmModal
        isOpen={true}
        title="Título Teste"
        message="Mensagem de teste"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    // Assert
    expect(screen.getByText('Título Teste')).toBeInTheDocument();
    expect(screen.getByText('Mensagem de teste')).toBeInTheDocument();
  });

  it('deve chamar onConfirm e onCancel ao clicar no botão de confirmação', () => {
    // Arrange
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar Ação"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        confirmText="Sim, tenho"
      />,
    );

    // Act: Encontra o botão pelo seu texto e simula um clique
    const confirmButton = screen.getByRole('button', { name: /sim, tenho/i });
    fireEvent.click(confirmButton);

    // Assert
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    // Nossa implementação atual chama onCancel para fechar o modal após a confirmação
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('deve chamar apenas onCancel ao clicar no botão de cancelar', () => {
    // Arrange
    render(
      <ConfirmModal
        isOpen={true}
        title="Cancelar Ação"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        cancelText="Não, voltar"
      />,
    );

    // Act
    const cancelButton = screen.getByRole('button', { name: /não, voltar/i });
    fireEvent.click(cancelButton);

    // Assert
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('deve aplicar a classe de perigo quando "isDestructive" for verdadeiro', () => {
    // Arrange
    render(
      <ConfirmModal
        isOpen={true}
        title="Excluir"
        message="Ação irreversível"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDestructive={true}
      />,
    );

    // Assert
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmButton).toHaveClass('bg-red-600');
  });
});
