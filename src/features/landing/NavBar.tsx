import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LogoIcon from '../../assets/icons/logo.svg?react';
import { LocaleSwitcher } from '../../components/ui/LocaleSwitcher';
import { Icon } from './Icon';
import { Btn } from './Btn';

interface NavBarProps {
  dark: boolean;
  setDark: (value: boolean) => void;
  onAdminClick: () => void;
}

const LINKS = [
  { href: '#ecosystem', key: 'nav.ecosystem' },
  { href: '#features', key: 'nav.features' },
  { href: '#screens', key: 'nav.screens' },
  { href: '#engineering', key: 'nav.engineering' },
  { href: '#contact', key: 'nav.contact' },
] as const;

export function NavBar({ dark, setDark, onAdminClick }: NavBarProps) {
  const { t } = useTranslation('landing');
  const [scrolled, setScrolled] = useState(false);

  // A barra chega translúcida e sem borda sobre o hero, e ganha fundo + borda
  // depois do primeiro rolar. Só cor e sombra mudam: nada de altura, senão a
  // página inteira reflui a cada scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? 'border-b border-paper-300 bg-paper-100/85 backdrop-blur-md dark:border-white/10 dark:bg-ink-950/85'
          : // Nem fundo nem blur no topo: qualquer um dos dois desenha uma faixa
            // visível sobre a malha do hero.
            'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2.5 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400"
        >
          <LogoIcon className="h-8 w-8 text-lumi-500" aria-hidden="true" />
          {/* O nome sai da tela abaixo de 400px para o botão "Entrar" não ser
              empurrado para fora num celular pequeno — mas com `sr-only`, não
              com `hidden`: escondido de vez, o link ficava só com o SVG e sem
              nome acessível nenhum. */}
          <span className="sr-only text-lg font-extrabold tracking-tight min-[400px]:not-sr-only">
            LumiLivre
          </span>
        </a>

        {/* Rótulos em versalete espaçado, como as guias de uma gaveta: mais
            estreitos que o corpo do texto, e o único elemento tipográfico da
            barra que não é a marca. */}
        <nav
          aria-label="LumiLivre"
          className="hidden items-center gap-8 text-[12px] font-bold uppercase tracking-[0.1em] text-paper-600 lg:flex dark:text-ink-400"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative py-1 transition-colors hover:text-lumi-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:hover:text-lumi-200"
            >
              {t(link.key)}
              {/* Sublinhado que cresce do centro — transform puro, sem mexer no
                  espaço que o link ocupa. */}
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-center scale-x-0 bg-lumi-500 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 dark:bg-lumi-label"
              />
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setDark(!dark)}
            aria-label={t('aria.toggleTheme')}
            className="flex h-10 w-10 items-center justify-center rounded-control text-paper-600 transition-colors hover:bg-paper-200 hover:text-lumi-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-lumi-200"
          >
            <Icon name={dark ? 'sun' : 'moon'} size={18} />
          </button>
          <LocaleSwitcher placement="bottom" />
          <Btn
            href="/login"
            onClick={(event) => {
              event.preventDefault();
              onAdminClick();
            }}
            variant="primary"
            size="sm"
            icon={<Icon name="user" size={15} />}
          >
            {t('nav.signIn')}
          </Btn>
        </div>
      </div>
    </header>
  );
}
