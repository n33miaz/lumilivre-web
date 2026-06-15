import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarLocaleSwitcher } from '../../../layouts/components/SidebarLocaleSwitcher';
import * as LocaleContext from '../../../contexts/LocaleContext';

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

describe('SidebarLocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale: vi.fn(),
    });
  });

  it('expõe o short do locale ativo no chip do trigger', () => {
    render(<SidebarLocaleSwitcher isExpanded={false} />);
    const trigger = screen.getByRole('button', { name: switchLanguageName });
    expect(trigger).toHaveTextContent('PT');
  });

  it('quando expandida, mostra também o label do locale ativo', () => {
    render(<SidebarLocaleSwitcher isExpanded={true} />);
    expect(screen.getByText('Português')).toBeInTheDocument();
  });

  it('abre o menu ao clicar e expõe LOCALES como listbox', () => {
    render(<SidebarLocaleSwitcher isExpanded={true} />);

    const trigger = screen.getByRole('button', { name: switchLanguageName });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toBeGreaterThanOrEqual(2);
  });

  it('seleciona um locale via click e fecha o menu', () => {
    const setLocale = vi.fn();
    mockUseLocale.mockReturnValue({
      locale: 'pt-BR',
      setLocale,
    });

    render(<SidebarLocaleSwitcher isExpanded={true} />);
    fireEvent.click(screen.getByRole('button', { name: switchLanguageName }));

    const englishOption = screen.getByRole('option', { name: /english/i });
    fireEvent.click(englishOption);

    expect(setLocale).toHaveBeenCalledWith('en-US');
  });
});
