import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LocaleSwitcher } from '../../../components/ui/LocaleSwitcher';
import { resolvePlacement } from '../../../components/ui/localeMenu';
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
const switchLanguageName = /trocar idioma|switch language/i;

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

    const trigger = screen.getByRole('button', { name: switchLanguageName });
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

    const trigger = screen.getByRole('button', { name: switchLanguageName });
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

    fireEvent.click(screen.getByRole('button', { name: switchLanguageName }));
    fireEvent.click(screen.getByRole('option', { name: /english/i }));

    expect(setLocale).toHaveBeenCalledWith('en-US');
  });

  it('fecha o menu ao pressionar Escape', async () => {
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale: vi.fn(),
    });

    render(<LocaleSwitcher />);

    const trigger = screen.getByRole('button', { name: switchLanguageName });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // usePresence mantém o menu montado durante a animação de saída (~160ms).
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
  });

  it('navega entre opções com ArrowDown e seleciona com Enter', () => {
    const setLocale = vi.fn();
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale,
    });

    render(<LocaleSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: switchLanguageName }));

    const listbox = screen.getByRole('listbox');
    act(() => {
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    });

    const enUsOption = screen.getByRole('option', { name: /english/i });
    fireEvent.keyDown(enUsOption, { key: 'Enter' });

    expect(setLocale).toHaveBeenCalledWith('en-US');
  });

  it('calcula top-end quando o menu nao cabe abaixo nem a direita', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 320,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 240,
    });

    const button = document.createElement('button');
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      x: 250,
      y: 210,
      top: 210,
      right: 290,
      bottom: 234,
      left: 250,
      width: 40,
      height: 24,
      toJSON: () => ({}),
    });

    expect(resolvePlacement(button, { width: 156, height: 88 })).toBe(
      'top-end',
    );
  });

  it('calcula right-start quando nao ha espaco vertical e ha espaco a direita', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 420,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 120,
    });

    const button = document.createElement('button');
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      x: 8,
      y: 44,
      top: 44,
      right: 72,
      bottom: 76,
      left: 8,
      width: 64,
      height: 32,
      toJSON: () => ({}),
    });

    expect(resolvePlacement(button, { width: 156, height: 88 })).toBe(
      'right-start',
    );
  });
});
