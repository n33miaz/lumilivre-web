import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { BrowserFrame } from './BrowserFrame';
import { PrintPicture } from './PrintPicture';
import { PRINTS, type ScreenPrint } from './prints';
import { SectionHeader } from './SectionHeader';
import { SHELF_MARKS } from './shelfMarks';

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
 * Interesse e Ranking — com troca por fade e reação ao tema claro/escuro.
 *
 * A ordem conta uma história e não é alfabética: o estado da biblioteca, o que
 * ela tem, o que está circulando, o que falta comprar e o efeito nos alunos.
 * A Central de Relatórios saiu daqui na regeração dos prints — é um menu de
 * botões "Gerar", não uma tela em que o sistema esteja fazendo algo; ela ficou
 * no README, onde quem lê já está disposto a rolar.
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
      (['dashboard', 'books', 'loans', 'interest', 'ranking'] as const).map(
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
      className="paper-surface relative overflow-hidden bg-paper-200 py-24 dark:bg-ink-900/50 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeader
          mark={SHELF_MARKS.screens}
          eyebrow={t('screens.eyebrow')}
          title={t('screens.title')}
          lead={t('screens.subtitle')}
        />

        {/* Divisórias de gaveta: as abas eram pastilhas com degradê e sombra
            colorida, iguais às de qualquer painel de preços. Agora são etiquetas
            retangulares alinhadas à esquerda — a escolhida vira um bloco cheio
            de tinta da marca, as outras ficam em papel com filete. A base de 3px
            existe nas cinco (só muda de cor), então trocar de aba não altera
            altura nenhuma e a fileira nunca reflui. */}
        <div
          ref={tablistRef}
          role="tablist"
          aria-label={t('screens.aria.tablist')}
          onKeyDown={handleTablistKeyDown}
          data-reveal
          data-reveal-delay="3"
          className="mb-10 flex flex-wrap gap-1.5"
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
                className={`rounded-[2px] border border-b-[3px] px-3.5 py-2 text-[13px] font-bold transition-[background-color,color,border-color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-200 dark:focus-visible:ring-offset-ink-900 ${
                  selected
                    ? 'border-lumi-500 border-b-lumi-500 bg-lumi-500 text-white dark:border-lumi-label dark:border-b-lumi-label dark:bg-lumi-500'
                    : 'border-paper-300 border-b-paper-300 bg-paper-50 text-paper-600 hover:border-lumi-400 hover:text-lumi-600 dark:border-white/10 dark:border-b-white/10 dark:bg-white/5 dark:text-ink-400 dark:hover:text-lumi-200'
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
          // 4/8 de doze: mais uma proporção diferente das vizinhas (o herói é
          // 7/5, a figura do topo 3/9). Nenhuma seção repete a divisão da
          // anterior — é assim que a página ganha ritmo sem mudar de estilo.
          //
          // `items-start` e não `items-center`: centralizado, o filete do
          // título flutuava no meio de um vazio de 150px ao lado de uma imagem
          // muito mais alta. Alinhados pelo topo, o filete e a borda superior da
          // moldura ficam na mesma linha — que é o que amarra as duas colunas.
          className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-12"
        >
          <div
            data-reveal
            data-reveal-delay="4"
            className="order-2 lg:order-1 lg:col-span-4"
          >
            <h3 className="mb-3 border-t-2 border-paper-900 pt-4 font-display text-[1.6rem] font-extrabold leading-tight tracking-[-0.02em] text-paper-900 dark:border-ink-100/80 dark:text-ink-100">
              {current.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-paper-600 dark:text-ink-200">
              {current.description}
            </p>
          </div>

          <div
            data-reveal
            data-reveal-delay="5"
            className="order-1 lg:order-2 lg:col-span-8"
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
