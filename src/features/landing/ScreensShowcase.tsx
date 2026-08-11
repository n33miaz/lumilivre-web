import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BrowserFrame } from './BrowserFrame';
import { Icon } from './Icon';
import { PrintPicture } from './PrintPicture';
import {
  PRINTS,
  SYSTEM_ORDER,
  SYSTEMS,
  type PrintKey,
  type ScreenPrint,
  type SystemKey,
} from './prints';
import { SectionHeader } from './SectionHeader';
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
 * Duração das micro-transições do framer-motion (item 1: 200ms em tudo).
 * Vira 0 sob movimento reduzido — sem trajeto, a troca é instantânea.
 */
const MOVE_S = 0.2;

/**
 * Moldura de celular para os prints do aplicativo Flutter.
 *
 * Mora aqui, e não em arquivo próprio, porque só a vitrine usa: é a peça irmã da
 * `BrowserFrame` e existe pelo mesmo motivo dela — dizer de que superfície veio
 * a captura sem precisar escrever isso na legenda.
 *
 * `h-full` mais proporção: a altura vem do palco (que é fixo) e a LARGURA é que
 * se ajusta. É isso que deixa retrato e paisagem conviverem sem a página saltar
 * quando o seletor troca de painel para app. `aspect-[1080/2400]` casa com o
 * arquivo real (1080x2400), então o `object-cover` mostra o print inteiro, sem
 * corte.
 */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative aspect-[1080/2400] h-full overflow-hidden rounded-[1.6rem] border-[6px] border-paper-900 bg-paper-100 shadow-[0_28px_60px_-32px_rgba(26,24,20,0.55)] dark:border-ink-700 dark:bg-ink-950 dark:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.9)]">
        {children}
      </div>
    </div>
  );
}

/**
 * Vitrine das telas reais — o painel (WebSite) e o aplicativo (Application),
 * com um seletor de sistema, troca por fade e reação ao tema claro/escuro.
 *
 * A ordem de cada sistema conta uma história e não é alfabética; ela vive em
 * `prints.ts`, junto das imagens.
 *
 * **A troca é automática**, a pedido do dono, e todo o cuidado está em não
 * roubar o controle de quem está lendo:
 *
 * - pausa no hover, no foco de teclado e com a aba oculta (`visibilitychange`) —
 *   sem a última, o autoplay roda em segundo plano e queima os slides sem
 *   ninguém ver;
 * - `prefers-reduced-motion` desliga o avanço automático por inteiro e zera a
 *   duração das animações: sobram as setas, as abas e o seletor, todos
 *   funcionando na hora, sem trajeto;
 * - o relógio reinicia a cada troca (inclusive manual e de sistema): o efeito
 *   depende de `active` e `system`, então qualquer mudança recomeça a contagem
 *   inteira em vez de herdar o resto do ciclo anterior.
 *
 * **O ciclo automático inclui a troca de sistema**: percorre os prints do painel,
 * passa para o app, percorre os dele e volta — a alternância web↔app faz parte da
 * apresentação, com a mesma animação suave (framer-motion `layout`/`layoutId`).
 *
 * As abas continuam sendo o padrão ARIA de tablist (setas, Home/End, um único
 * ponto de tabulação) e o seletor é um `radiogroup`. As camadas invisíveis do
 * fade saem da árvore de acessibilidade para o leitor de tela não anunciar as
 * telas todas juntas.
 */
export function ScreensShowcase() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [system, setSystem] = useState<SystemKey>('web');
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const tablistRef = useRef<HTMLDivElement>(null);
  // Só o foco por TECLADO pausa o autoplay. O foco que chega de um clique de
  // mouse não deve travar a apresentação: senão clicar numa aba e afastar o mouse
  // deixava o carrossel parado para sempre (a aba continua focada). É a mesma
  // heurística do `:focus-visible` — última interação foi tecla ou ponteiro?
  const keyboardNav = useRef(false);

  const screens: Screen[] = useMemo(
    () =>
      SYSTEM_ORDER[system].map((key) => ({
        key,
        tab: t(`screens.${key}.tab`),
        title: t(`screens.${key}.title`),
        description: t(`screens.${key}.desc`),
        alt: t(`screens.${key}.alt`),
        print: PRINTS[key],
      })),
    [system, t],
  );

  const total = screens.length;
  // Índice pode ficar fora do novo intervalo por um render, entre a troca de
  // sistema e o reset de `active` — o fallback evita ler `undefined`.
  const current = screens[active] ?? screens[0];
  const moveDuration = prefersReducedMotion ? 0 : MOVE_S;

  // Troca de sistema pelo seletor: sempre volta ao primeiro slide do conjunto.
  const selectSystem = useCallback(
    (next: SystemKey) => {
      if (next === system) return;
      setSystem(next);
      setActive(0);
    },
    [system],
  );

  // Setas: navegam dentro do sistema ativo, dando a volta.
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

  // Marca a modalidade da última interação, antes de o foco entrar no carrossel.
  // Capture para chegar antes do `focus` que o clique/tecla dispara.
  useEffect(() => {
    const onPointer = () => (keyboardNav.current = false);
    const onKey = () => (keyboardNav.current = true);
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  const autoplay =
    !prefersReducedMotion && pageVisible && !hovered && !focused;

  useEffect(() => {
    if (!autoplay) return;
    // Um `setTimeout` por slide (e não um `setInterval` de vida longa): cada
    // troca — automática, manual ou de sistema — recomeça a contagem inteira, em
    // vez de herdar o resto do ciclo anterior.
    const timer = window.setTimeout(() => {
      if (active + 1 < total) {
        setActive(active + 1);
        return;
      }
      // Fim do sistema atual → passa para o próximo e recomeça nele. É esta
      // linha que põe a troca web↔app dentro do ciclo automático.
      const nextSystem = SYSTEMS[(SYSTEMS.indexOf(system) + 1) % SYSTEMS.length];
      setSystem(nextSystem);
      setActive(0);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, active, total, system]);

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
      className="emenda emenda-dobra paper-surface relative overflow-hidden bg-paper-200 py-24 dark:bg-ink-900/50 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow={t('screens.eyebrow')}
          title={t('screens.title')}
          lead={t('screens.subtitle')}
        />

        {/* A região do carrossel envolve seletor, abas, legenda e palco: é ela
            que escuta hover e foco, então parar de ler para clicar não deixa o
            relógio correndo por baixo. `onFocus`/`onBlur` do React são
            focusin/focusout — sobem da árvore, ao contrário dos nativos. */}
        <div
          data-carousel
          role="group"
          aria-roledescription="carousel"
          aria-label={t('screens.aria.carousel')}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(keyboardNav.current)}
          onBlur={() => setFocused(false)}
        >
          {/* Seletor de sistema: WebSite | Application. A pastilha da opção ativa
              é um elemento de layout compartilhado (`layoutId`) — ao trocar, ela
              DESLIZA de um lado ao outro em vez de piscar. É o "move de lugar"
              suave que o dono pediu. */}
          <div
            role="radiogroup"
            aria-label={t('screens.aria.system')}
            data-reveal
            data-reveal-delay="3"
            className="mb-7 inline-flex items-center gap-1 rounded-control border border-paper-300 bg-paper-50 p-1 dark:border-white/10 dark:bg-white/5"
          >
            {SYSTEMS.map((sys) => {
              const selected = system === sys;
              return (
                <button
                  key={sys}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectSystem(sys)}
                  className="relative rounded-md px-4 py-1.5 text-[13px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-200 dark:focus-visible:ring-offset-ink-900"
                >
                  {selected && (
                    <motion.span
                      layoutId="screens-system-pill"
                      aria-hidden="true"
                      transition={{ duration: moveDuration, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute inset-0 rounded-md bg-lumi-500 shadow-[0_6px_16px_-8px_rgba(94,25,93,0.7)] dark:bg-lumi-500"
                    />
                  )}
                  <span
                    className={`relative z-[1] transition-colors duration-200 ${
                      selected
                        ? 'text-white'
                        : 'text-paper-600 hover:text-lumi-600 dark:text-ink-400 dark:hover:text-lumi-200'
                    }`}
                  >
                    {t(`screens.system.${sys}`)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Abas do sistema ativo. Trocar de sistema troca o conjunto inteiro de
              abas: as que saem esmaecem e encolhem, as que entram fazem o
              contrário, e `layout` desliza as posições — o palco não reflui de
              repente. A base de 3px existe em todas (só muda de cor), então
              alternar de aba não altura nenhuma. */}
          <motion.div
            ref={tablistRef}
            role="tablist"
            aria-label={t('screens.aria.tablist')}
            onKeyDown={handleTablistKeyDown}
            layout
            data-reveal
            data-reveal-delay="4"
            className="mb-10 flex flex-wrap gap-1.5"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {screens.map((screen, index) => {
                const selected = active === index;
                return (
                  <motion.button
                    key={screen.key}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: moveDuration, ease: 'easeOut' }}
                    id={`${TAB_ID_PREFIX}${screen.key}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={PANEL_ID}
                    // Um só ponto de tabulação no grupo: dentro dele a navegação é
                    // por seta, como manda o padrão de tablist.
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(index)}
                    className={`rounded-control border border-b-[3px] px-3.5 py-2 text-[13px] font-bold transition-[background-color,color,border-color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-200 dark:focus-visible:ring-offset-ink-900 ${
                      selected
                        ? 'border-lumi-500 border-b-lumi-500 bg-lumi-500 text-white dark:border-lumi-300 dark:border-b-lumi-300 dark:bg-lumi-500'
                        : 'border-paper-300 border-b-paper-300 bg-paper-50 text-paper-600 hover:border-lumi-400 hover:text-lumi-600 dark:border-white/10 dark:border-b-white/10 dark:bg-white/5 dark:text-ink-400 dark:hover:text-lumi-200'
                    }`}
                  >
                    {screen.tab}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <div
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={`${TAB_ID_PREFIX}${current.key}`}
            // `items-start` e não `items-center`: alinhados pelo topo, o filete do
            // título e a borda superior da moldura ficam na mesma linha — que é o
            // que amarra as duas colunas.
            className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-12"
          >
            <div
              data-reveal
              data-reveal-delay="5"
              className="order-2 lg:order-1 lg:col-span-4"
            >
              {/* Posição em cota de lombada ("03 / 05"): mesmo vocabulário de
                  ficha do resto da página, e diz quantas telas faltam — coisa que
                  bolinha não diz sem contar. Fica fora da árvore de acessibilidade
                  porque a mesma informação já está no `aria-selected` das abas.
                  Acompanha o conjunto ativo (o total muda com o sistema). */}
              <div
                aria-hidden="true"
                className="mb-3 border-t border-paper-300 pt-4 dark:border-white/10"
              >
                <span className="cota text-[11px] text-paper-500 dark:text-ink-400">
                  {String(active + 1).padStart(2, '0')} /{' '}
                  {String(total).padStart(2, '0')}
                </span>
              </div>
              {/* Legenda em cross-fade a cada troca de slide OU de sistema. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${system}-${active}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: moveDuration, ease: 'easeOut' }}
                >
                  <h3 className="mb-3 font-display text-[1.6rem] font-extrabold leading-tight tracking-[-0.02em] text-paper-900 dark:text-ink-100">
                    {current.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-paper-600 dark:text-ink-200">
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div
              data-reveal
              data-reveal-delay="6"
              className="relative order-1 lg:order-2 lg:col-span-8"
            >
              {/* PALCO. A altura sai de uma moldura de navegador invisível em
                  fluxo normal: a caixa fica FIXA (16/10), e altura fixa é o que
                  permite misturar retrato e paisagem sem a página pular quando o
                  seletor troca de painel para app. */}
              <div aria-hidden="true" className="invisible">
                <BrowserFrame path="">
                  <span />
                </BrowserFrame>
              </div>

              {/* A troca de SISTEMA cruza a pilha inteira: a do painel esmaece
                  enquanto a do app entra (dissolvência, não corte). Dentro de um
                  sistema, quem troca de slide é a opacidade de cada camada. */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={system}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: moveDuration, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  {screens.map((screen, index) => {
                    const visible = active === index;
                    return (
                      <div
                        key={screen.key}
                        aria-hidden={!visible || undefined}
                        className={`absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none ${
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
                </motion.div>
              </AnimatePresence>

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
