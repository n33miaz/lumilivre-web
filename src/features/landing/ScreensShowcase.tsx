import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { BrowserFrame } from './BrowserFrame';
import { PrintPicture } from './PrintPicture';
import { PRINTS, type ScreenPrint } from './prints';
import { SectionHeader } from './SectionHeader';

interface Screen {
  key: keyof typeof PRINTS;
  tab: string;
  title: string;
  description: string;
  alt: string;
  print: ScreenPrint;
}

const TAB_ID_PREFIX = 'screens-tab-';
const PANEL_ID = 'screens-panel';

/**
 * Vitrine das telas reais do painel — Visão gerencial, Acervo, Empréstimos,
 * Ranking e Relatórios — com troca por fade e reação ao tema claro/escuro.
 *
 * A troca é sempre manual: um carrossel automático rouba o controle de quem está
 * lendo a legenda. As abas seguem o padrão ARIA de tablist (setas, Home/End,
 * um único ponto de tabulação), e as camadas invisíveis do fade saem da árvore
 * de acessibilidade para o leitor de tela não anunciar as cinco telas juntas.
 */
export function ScreensShowcase() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();
  const [active, setActive] = useState(0);
  const tablistRef = useRef<HTMLDivElement>(null);

  const screens: Screen[] = useMemo(
    () =>
      (['dashboard', 'books', 'loans', 'ranking', 'reports'] as const).map(
        (key) => ({
          key,
          tab: t(`screens.${key}.tab`),
          title: t(`screens.${key}.title`),
          description: t(`screens.${key}.desc`),
          alt: t(`screens.${key}.alt`),
          print: PRINTS[key],
        }),
      ),
    [t],
  );

  const current = screens[active];

  const focusTab = (index: number) => {
    setActive(index);
    tablistRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      .item(index)
      ?.focus();
  };

  const handleTablistKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = screens.length - 1;
    switch (event.key) {
      case 'ArrowRight':
        focusTab(active === last ? 0 : active + 1);
        break;
      case 'ArrowLeft':
        focusTab(active === 0 ? last : active - 1);
        break;
      case 'Home':
        focusTab(0);
        break;
      case 'End':
        focusTab(last);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <section
      id="screens"
      className="relative overflow-hidden bg-gray-50 py-24 dark:bg-ink-900/40 sm:py-28"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow={t('screens.eyebrow')}
          title={t('screens.title')}
          lead={t('screens.subtitle')}
        />

        <div
          ref={tablistRef}
          role="tablist"
          aria-label={t('screens.aria.tablist')}
          onKeyDown={handleTablistKeyDown}
          data-reveal
          data-reveal-delay="3"
          className="mb-10 flex flex-wrap justify-center gap-2"
        >
          {screens.map((screen, index) => {
            const selected = active === index;
            return (
              <button
                key={screen.key}
                id={`${TAB_ID_PREFIX}${screen.key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={PANEL_ID}
                // Um só ponto de tabulação no grupo: dentro dele a navegação é
                // por seta, como manda o padrão de tablist.
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-[background-color,color,box-shadow,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-ink-900 ${
                  selected
                    ? 'bg-lumi-gradient text-white shadow-glowSoft'
                    : 'bg-white text-gray-600 hover:-translate-y-px hover:text-lumi-600 dark:bg-white/5 dark:text-gray-300 dark:hover:text-lumi-200'
                }`}
              >
                {screen.tab}
              </button>
            );
          })}
        </div>

        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={`${TAB_ID_PREFIX}${current.key}`}
          className="grid items-center gap-10 lg:grid-cols-5"
        >
          <div
            data-reveal
            data-reveal-delay="4"
            className="order-2 lg:order-1 lg:col-span-2"
          >
            <h3 className="mb-3 font-display text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {current.title}
            </h3>
            <p className="leading-relaxed text-gray-600 dark:text-gray-400">
              {current.description}
            </p>
          </div>

          <div
            data-reveal
            data-reveal-delay="5"
            className="order-1 lg:order-2 lg:col-span-3"
          >
            <BrowserFrame path={current.print.path}>
              {screens.map((screen, index) => (
                <PrintPicture
                  key={screen.key}
                  print={screen.print}
                  isDark={isDark}
                  alt={screen.alt}
                  hiddenFromReaders={active !== index}
                  className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
                    active === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </BrowserFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
