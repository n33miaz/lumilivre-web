import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../../../components/ui/Button';

describe('Componente Button', () => {
  it('deve renderizar o botão com o texto correto', () => {
    render(<Button>Clique aqui</Button>);

    const buttonElement = screen.getByRole('button', { name: /clique aqui/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('deve aplicar as classes corretas para a variante "danger"', () => {
    // Arrange
    render(<Button variant="danger">Excluir</Button>);

    // Assert
    const buttonElement = screen.getByRole('button', { name: /excluir/i });
    expect(buttonElement).toHaveClass('bg-red-600');
  });

  it('deve estar desabilitado quando a prop "disabled" for passada', () => {
    // Arrange
    render(<Button disabled>Desabilitado</Button>);

    // Assert
    const buttonElement = screen.getByRole('button', { name: /desabilitado/i });
    expect(buttonElement).toBeDisabled();
  });

  it('deve mostrar o texto de loading e estar desabilitado no estado de "isLoading"', () => {
    // Arrange
    const loadingText = 'Carregando...';
    render(
      <Button isLoading={true} loadingText={loadingText}>
        Enviar
      </Button>,
    );

    // Assert
    const buttonElement = screen.getByRole('button', { name: /carregando/i });

    // Verifica se o texto de loading está na tela
    expect(screen.getByText(loadingText)).toBeInTheDocument();

    // Verifica se o texto original ("Enviar") NÃO está na tela
    expect(screen.queryByText('Enviar')).not.toBeInTheDocument();

    // Verifica se o botão está desabilitado
    expect(buttonElement).toBeDisabled();
  });
});
