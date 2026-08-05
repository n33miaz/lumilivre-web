import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { DownloadAppPage } from '../../pages/Download';
import i18n, { DEFAULT_LOCALE } from '../../i18n';

const APK =
  'https://github.com/n33miaz/lumilivre-app/releases/latest/download/lumilivre.apk';
const RELEASES = 'https://github.com/n33miaz/lumilivre-app/releases';

const renderPage = () =>
  render(
    <MemoryRouter>
      <DownloadAppPage />
    </MemoryRouter>,
  );

describe('Página: Download do app', () => {
  beforeEach(async () => {
    // O redirecionamento automático usa setTimeout; com timer falso ele nunca
    // dispara e o jsdom não tenta navegar durante os testes.
    vi.useFakeTimers();
    await i18n.changeLanguage(DEFAULT_LOCALE);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('aponta para o APK publicado quando VITE_APK_URL vem no build', () => {
    vi.stubEnv('VITE_APK_URL', APK);

    renderPage();

    expect(
      screen.getByRole('heading', { name: /Baixando LumiLivre/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Clique se não iniciou/i }),
    ).toHaveAttribute('href', APK);
  });

  it('avisa e oferece as releases quando a variável não foi configurada', () => {
    vi.stubEnv('VITE_APK_URL', '');

    renderPage();

    expect(
      screen.getByRole('heading', { name: /Download indisponível/i }),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Ver versões publicadas/i });
    expect(link).toHaveAttribute('href', RELEASES);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('recusa endereço com esquema fora de http(s)', () => {
    vi.stubEnv('VITE_APK_URL', 'javascript:alert(1)');

    renderPage();

    expect(
      screen.getByRole('heading', { name: /Download indisponível/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver versões/i })).toHaveAttribute(
      'href',
      RELEASES,
    );
  });
});
