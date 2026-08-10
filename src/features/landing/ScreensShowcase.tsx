import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BrowserFrame } from './BrowserFrame';
import { Icon } from './Icon';
import { PrintPicture } from './PrintPicture';
import { PRINTS, PRINT_ORDER, type PrintKey, type ScreenPrint } from './prints';
import { SectionHeader } from './SectionHeader';
import { SHELF_MARKS } from './shelfMarks';
import './ScreensShowcase.css';

interface Screen {
  key: PrintKey;
  tab: string;
  title: string;
  description: string;
  alt: string;
  print: ScreenPrint;
}

const TAB_ID_PREFIX = 'screens-tab-';
const PANEL_ID = 'screens-panel';

/**
 * Intervalo do avanço automático.
 *
 * Oito segundos porque a legenda de cada print tem 35 a 50 palavras: em leitura
 * de tela (~250 ppm de varredura) isso dá 8 a 12 segundos, e quem estiver
 * realmente lendo passa o ponteiro por cima — o que pausa. Menos do que isso
 * troca a imagem no meio da frase, que é o vício clássico de carrossel.
 */
const AUTOPLAY_MS = 8000;

/**
 * Moldura de celular para os prints do aplicativo Flutter.
 *
 * Mora aqui, e não em arquivo próprio, porque só a vitrine usa: é a peça irmã da
 * `BrowserFrame` e existe pelo mesmo motivo dela — dizer de que superfície veio
 * a captura sem precisar escrever isso na legenda.
 *
 * `h-full` mais proporção: a altura vem do palco (que é fixo) e a LARGURA é que
 * se ajusta. É isso que deixa retrato e paisagem conviverem sem a página saltar
 * quando o carrossel troca de um para o outro.
 */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center">
      {/* 1080x2340 é o retrato de celular corrente (9:19,5). Escrito em pixels
          reais para casar com o arquivo que vier, não como fração abstrata. */}
      <div className="relative aspect-[1080/2340] h-full overflow-hidden rounded-[1.25rem] border-[6px] border-paper-900 bg-paper-100 shadow-[0_28px_60px_-32px_rgba(26,24,20,0.55)] dark:border-ink-700 dark:bg-ink-950 dark:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.9)]">
        {children}
      </div>
    </div>
  );
}

/**
 * Vitrine das telas reais do painel — Visão gerencial, Acervo, Empréstimos,
 * Interesse e Ranking — com troca por fade e reação ao tema claro/escuro.
 *
 * A ordem conta uma história e não é alfabética; ela vive em `prints.ts`, junto
 * das imagens. A Central de Relatórios saiu daqui na regeração dos prints — é um
 * menu de botões "Gerar", não uma tela em que o sistema esteja fazendo algo; ela
 * ficou no README, onde quem lê já está disposto a rolar.
 *
 * **A troca virou automática**, a pedido do dono, e todo o cuidado está em não
 * roubar o controle de quem está lendo:
 *
 * - pausa no hover, no foco de teclado e com a aba oculta (`visibilitychange`) —
 *   sem a última, o autoplay roda em segundo plano e queima os cinco slides sem
 *   ninguém ver;
 * - `prefers-reduced-motion` desliga o avanço automático por inteiro: sobram as
 *   setas e as abas;
 * - o relógio reinicia a cada troca (inclusive manual), senão um clique podia
 *   ser seguido de um avanço automático meio segundo depois.
 *
 * As abas continuam sendo o padrão ARIA de tablist (setas, Home/End, um único
 * ponto de tabulação) e passam a fazer o papel de seletor de slide dentro de uma
 * região de carrossel. As camadas invisíveis do fade saem da árvore de
 * acessibilidade para o leitor de tela não anunciar as cinco telas juntas.
 */
export function ScreensShowcase() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const tablistRef = useRef<HTMLDivElement>(null);

  const screens: Screen[] = useMemo(
    () =>
      PRINT_ORDER.map((key) => ({
        key,
        tab: t(`screens.${key}.tab`),
        title: t(`screens.${key}.title`),
        description: t(`screens.${key}.desc`),
        alt: t(`screens.${key}.alt`),
        print: PRINTS[key],
      })),
    [t],
  );

  const total = screens.length;
  const current = screens[active];

  const go = useCallback(
    (step: number) => setActive((index) => (index + step + total) % total),
    [total],
  );

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState === 'visible');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const autoplay =
    !prefersReducedMotion && pageVisible && !hovered && !focused && total > 1;

  useEffect(() => {
    if (!autoplay) return;
    // Um `setTimeout` por slide (e não um `setInterval` de vida longa): assim
    // cada troca — automática ou manual — recomeça a contagem inteira, em vez de
    // herdar o resto do ciclo anterior e trocar de imagem logo após um clique.
    const next = (active + 1) % total;
    const timer = window.setTimeout(() => setActive(next), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, active, total]);

  const focusTab = (index: number) => {
    setActive(index);
    tablistRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      .item(index)
      ?.focus();
  };

  const handleTablistKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = total - 1;
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

  const arrowClass =
    'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-paper-300 bg-paper-50/90 text-paper-700 shadow-[0_6px_18px_-8px_rgba(26,24,20,0.6)] backdrop-blur hover:border-lumi-400 hover:text-lumi-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-200 dark:border-white/15 dark:bg-ink-900/85 dark:text-ink-200 dark:hover:text-lumi-200 dark:focus-visible:ring-offset-ink-900';

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

        {/* A região do carrossel envolve abas, legenda e palco: é ela que
            escuta hover e foco, então parar de ler para clicar numa aba não
            deixa o relógio correndo por baixo. `onFocus`/`onBlur` do React são
            focusin/focusout — sobem da árvore, ao contrário dos nativos. */}
        <div
          data-carousel
          role="group"
          aria-roledescription="carousel"
          aria-label={t('screens.aria.carousel')}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {/* Divisórias de gaveta: as abas eram pastilhas com degradê e sombra
              colorida, iguais às de qualquer painel de preços. Agora são
              etiquetas retangulares alinhadas à esquerda — a escolhida vira um
              bloco cheio de tinta da marca, as outras ficam em papel com filete.
              A base de 3px existe nas cinco (só muda de cor), então trocar de
              aba não altera altura nenhuma e a fileira nunca reflui. */}
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
                      ? 'border-lumi-500 border-b-lumi-500 bg-lumi-500 text-white dark:border-lumi-300 dark:border-b-lumi-300 dark:bg-lumi-500'
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
            // muito mais alta. Alinhados pelo topo, o filete e a borda superior
            // da moldura ficam na mesma linha — que é o que amarra as duas
            // colunas.
            className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-12"
          >
            <div
              data-reveal
              data-reveal-delay="4"
              className="order-2 lg:order-1 lg:col-span-4"
            >
              {/* Posição em cota de lombada ("03 / 05"), no lugar da fileira de
                  bolinhas: é o mesmo vocabulário de ficha de catálogo do resto
                  da página, e diz quantas telas faltam — coisa que bolinha não
                  diz sem contar. Fica fora da árvore de acessibilidade porque a
                  mesma informação já está no `aria-selected` das abas. */}
              <div
                aria-hidden="true"
                className="mb-3 border-t-2 border-paper-900 pt-4 dark:border-ink-100/80"
              >
                <span className="cota text-[11px] text-paper-500 dark:text-ink-400">
                  {String(active + 1).padStart(2, '0')} /{' '}
                  {String(total).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mb-3 font-display text-[1.6rem] font-extrabold leading-tight tracking-[-0.02em] text-paper-900 dark:text-ink-100">
                {current.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-paper-600 dark:text-ink-200">
                {current.description}
              </p>
            </div>

            <div
              data-reveal
              data-reveal-delay="5"
              className="relative order-1 lg:order-2 lg:col-span-8"
            >
              {/* PALCO. A altura sai de uma moldura de navegador invisível em
                  fluxo normal, e não de uma proporção chutada: assim a área do
                  print continua em 16/10 exatos (as capturas são 1440x900, então
                  não sobra corte nenhum) e, ao mesmo tempo, a caixa fica FIXA.
                  Altura fixa é o que permite misturar retrato e paisagem sem a
                  página pular a cada oito segundos. */}
              <div aria-hidden="true" className="invisible">
                <BrowserFrame path="">
                  <span />
                </BrowserFrame>
              </div>

              {screens.map((screen, index) => {
                const visible = active === index;
                return (
                  <div
                    key={screen.key}
                    aria-hidden={!visible || undefined}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      visible
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0'
                    }`}
                  >
                    {screen.print.kind === 'web' ? (
                      <BrowserFrame fill path={screen.print.path}>
                        <PrintPicture
                          print={screen.print}
                          isDark={isDark}
                          alt={screen.alt}
                          hiddenFromReaders={!visible}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                        />
                      </BrowserFrame>
                    ) : (
                      <PhoneFrame>
                        <PrintPicture
                          print={screen.print}
                          isDark={isDark}
                          alt={screen.alt}
                          hiddenFromReaders={!visible}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                        />
                      </PhoneFrame>
                    )}
                  </div>
                );
              })}

              {/* Setas discretas. A visibilidade delas é decidida em
                  `ScreensShowcase.css`, por capacidade de ponteiro. */}
              <button
                type="button"
                data-carousel-arrow
                aria-label={t('screens.aria.prev')}
                aria-controls={PANEL_ID}
                onClick={() => go(-1)}
                className={`${arrowClass} left-3`}
              >
                <Icon name="chevron-left" size={18} />
              </button>
              <button
                type="button"
                data-carousel-arrow
                aria-label={t('screens.aria.next')}
                aria-controls={PANEL_ID}
                onClick={() => go(1)}
                className={`${arrowClass} right-3`}
              >
                <Icon name="chevron-right" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
