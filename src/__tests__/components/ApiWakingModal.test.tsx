import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiWakingDialog } from '../../components/ApiWakingModal';
import { ApiWakingNoticeCard } from '../../components/ApiWakingNotice';
import { formatElapsed } from '../../components/apiHealthFormat';

const renderDialog = (props?: Partial<Parameters<typeof ApiWakingDialog>[0]>) => {
  const onClose = vi.fn();
  const onRetry = vi.fn();

  const utils = render(
    <ApiWakingDialog
      open
      isDown={false}
      elapsedMs={25_000}
      onClose={onClose}
      onRetry={onRetry}
      {...props}
    />,
  );

  return { ...utils, onClose, onRetry };
};

describe('formatElapsed', () => {
  it('mostra minuto e segundo com dois dígitos', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(7_400)).toBe('0:07');
    expect(formatElapsed(65_000)).toBe('1:05');
    expect(formatElapsed(192_000)).toBe('3:12');
  });
});

describe('ApiWakingDialog', () => {
  it('anuncia-se como alertdialog e recebe o foco ao abrir', () => {
    renderDialog();

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
  });

  it('mostra o tempo decorrido vindo do contexto, não da própria montagem', () => {
    renderDialog({ elapsedMs: 95_000 });

    expect(screen.getByText(/1:35/)).toBeInTheDocument();
  });

  it('fecha pelo Esc', () => {
    const { onClose } = renderDialog();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha pelo clique no fundo', () => {
    const { onClose, baseElement } = renderDialog();

    const backdrop = baseElement.querySelector('[aria-hidden="true"].absolute');
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha pelo botão de fechar e pela ação secundária', () => {
    const { onClose } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Continuar em segundo plano' }),
    );

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('dispara o health-check imediato pela ação primária', () => {
    const { onRetry } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar agora' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('prende o Tab dentro do diálogo', () => {
    renderDialog();

    const dialog = screen.getByRole('alertdialog');
    const focusables = [...dialog.querySelectorAll('button')];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('devolve o foco para onde ele estava ao fechar', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <ApiWakingDialog
        open
        isDown={false}
        elapsedMs={25_000}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole('alertdialog')).toHaveFocus();

    act(() => {
      rerender(
        <ApiWakingDialog
          open={false}
          isDown={false}
          elapsedMs={25_000}
          onClose={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
    });

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('no estado "down" troca a mensagem e some com o contador', () => {
    renderDialog({ isDown: true });

    expect(screen.getByText('Servidor ainda indisponível')).toBeInTheDocument();
    expect(screen.queryByText(/0:25/)).not.toBeInTheDocument();
  });

  it('não monta nada enquanto o contexto não pedir', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('ApiWakingNoticeCard', () => {
  it('mostra o relógio da espera e não deixa o leitor de tela lê-lo a cada segundo', () => {
    render(
      <ApiWakingNoticeCard
        open
        isDown={false}
        elapsedMs={42_000}
        onRetry={vi.fn()}
      />,
    );

    const clock = screen.getByText('0:42');
    expect(clock).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('oferece o retry sem precisar do modal', () => {
    const onRetry = vi.fn();
    render(
      <ApiWakingNoticeCard
        open
        isDown={false}
        elapsedMs={42_000}
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tentar agora' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('fica fora da tela quando o contexto não pede', () => {
    render(
      <ApiWakingNoticeCard
        open={false}
        isDown={false}
        elapsedMs={0}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
