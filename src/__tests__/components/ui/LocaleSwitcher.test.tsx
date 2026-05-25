import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LocaleSwitcher } from '../../../components/ui/LocaleSwitcher';
import * as LocaleContext from '../../../contexts/LocaleContext';
import { LOCALES } from '../../../i18n';

vi.mock('../../../contexts/LocaleContext', async () => {
  const actual = await vi.importActual<typeof LocaleContext>(
    '../../../contexts/LocaleContext',
  );
  return {
    ...actual,
    useLocale: vi.fn(),
  };
});

const mockUseLocale = vi.mocked(LocaleContext.useLocale);

describe('Componente: LocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o short do locale ativo no botão', () => {
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale: vi.fn(),
    });

    render(<LocaleSwitcher />);

    const trigger = screen.getByRole('button', { name: /switch language/i });
    expect(trigger).toHaveTextContent('PT');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre o menu, expõe todos os LOCALES e reflete aria-expanded', () => {
    mockUseLocale.mockReturnValue({
      locale: 'en-US',
      setLocale: vi.fn(),
    });

    render(<LocaleSwitcher />);

    const trigger = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(LOCALES.length);

    LOCALES.forEach((item) => {
      expect(
        screen.getByRole('option', { name: new RegExp(item.label, 'i') }),
      ).toBeInTheDocument();
    });

    const activeOption = screen.getByRole('option', { name: /english/i });
    expect(activeOption).toHaveAttribute('aria-selected', 'true');
  });

  it('seleciona um locale via click e chama setLocale', () => {
    const setLocale = vi.fn();
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale,
    });

    render(<LocaleSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: /switch language/i }));
    fireEvent.click(screen.getByRole('option', { name: /english/i }));

    expect(setLocale).toHaveBeenCalledWith('en-US');
  });

  it('fecha o menu ao pressionar Escape', () => {
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale: vi.fn(),
    });

    render(<LocaleSwitcher />);

    const trigger = screen.getByRole('button', { name: /switch language/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navega entre opções com ArrowDown e seleciona com Enter', () => {
    const setLocale = vi.fn();
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale,
    });

    render(<LocaleSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: /switch language/i }));

    const listbox = screen.getByRole('listbox');
    act(() => {
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    });

    const enUsOption = screen.getByRole('option', { name: /english/i });
    fireEvent.keyDown(enUsOption, { key: 'Enter' });

    expect(setLocale).toHaveBeenCalledWith('en-US');
  });
});
