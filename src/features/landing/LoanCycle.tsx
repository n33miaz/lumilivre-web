import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { SHELF_MARKS } from './shelfMarks';
import './LoanCycle.css';

/** Amplitude da inclinação, em graus. Herdada do print que estava aqui. */
const MAX_TILT = 4;

/** As seis batidas, na ordem em que a história acontece. */
const STEPS = [
  'shelf',
  'book',
  'interest',
  'request',
  'approve',
  'pickup',
] as const;

/** Topo de cada linha da lista do aplicativo. */
const APP_ROWS = [98, 128, 158, 188];

/** Centro vertical de cada linha da tabela do painel. A segunda fica de fora:
 *  é a solicitação que ainda não chegou, e ela é desenhada à parte. */
const WEB_ROWS = [149, 225, 263];

/**
 * Roda só quando vale a pena: o bloco precisa estar na tela E a aba precisa
 * estar em primeiro plano.
 *
 * Animação em laço fora de vista é o gasto de bateria mais fácil de evitar numa
 * landing — a página não tem como saber que ninguém está olhando se não
 * perguntar. Sem `IntersectionObserver` (jsdom, navegador antigo) a animação
 * simplesmente roda: perder a pausa é bem menos grave do que perder a animação.
 */
function useOnStage(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [onStage, setOnStage] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOnStage(false);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setOnStage(true);
      return;
    }

    // As duas condições são acompanhadas por fontes diferentes e combinadas num
    // estado só — daí serem lidas de variáveis, e não de dois `useState` que se
    // atropelariam.
    let visible =
      typeof document === 'undefined' || document.visibilityState === 'visible';
    let intersecting = false;
    const sync = () => setOnStage(visible && intersecting);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) intersecting = entry.isIntersecting;
        sync();
      },
      // Um pedaço visível já basta: exigir metade do bloco deixaria a sequência
      // parada justamente enquanto ela entra na tela.
      { threshold: 0.12 },
    );
    observer.observe(el);

    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref, enabled]);

  return onStage;
}

/**
 * O CICLO DO EMPRÉSTIMO — a abertura da página.
 *
 * Substitui o print estático do painel que ocupava este lugar. O pedido era
 * mostrar, em movimento, o que liga as duas metades do produto: **o aluno age
 * no aplicativo, a biblioteca decide no site**. Seis batidas — a estante, o
 * exemplar, o interesse, o pedido pelo app, a aprovação no painel, a retirada.
 *
 * O desenho é feito do MESMO material do resto da página, e é isso que o separa
 * de uma ilustração de banco de imagens: lombada com cota em mono, ficha de
 * catálogo com furo de fichário, filete de 2px como divisória, carimbo de
 * biblioteca. O aluno não é um bonequinho — é a carteirinha do leitor, que é
 * como uma biblioteca de verdade representa uma pessoa.
 *
 * **Onde ficou a prova.** Antes havia aqui uma captura real do painel, e trocar
 * prova por esquema tem custo. Três coisas pagam: o bloco é uma FICHA (papel,
 * canto de 2px), não uma moldura de navegador, então nunca se confunde com
 * captura; a legenda diz que é esquema e onde estão as telas; e a barra de
 * endereço do painel desenhado mostra a rota real (`/admin/loans`), como a
 * `BrowserFrame` sempre fez. As capturas de verdade continuam duas seções
 * abaixo, em "As telas de verdade, sem maquiagem".
 *
 * **O laço é infinito**, de propósito. Isto é a primeira coisa acima da dobra:
 * uma sequência que toca uma vez estaria terminada antes de a pessoa chegar, e
 * o que ela veria seria um quadro morto. Em laço, qualquer instante em que o
 * olho cai já está contando alguma coisa. O preço do laço é distração, e ele é
 * pago parando fora da tela (`useOnStage`) e evitando pulso perpétuo — cada
 * elemento se move uma vez por ciclo e depois fica quieto.
 *
 * A inclinação pelo ponteiro do print anterior ficou: é a mesma `.tilt-stage`,
 * com as variáveis escritas por CSSOM (nunca por atributo `style`, que a CSP
 * bloquearia). Mantê-la também evita deixar regra órfã em `index.css`.
 */
export function LoanCycle() {
  const { t } = useTranslation('landing');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const hasFinePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const running = useOnStage(rootRef, !prefersReducedMotion);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // -0.5..0.5 a partir do centro; o eixo X do rotateX é invertido para o
      // canto sob o ponteiro se aproximar, não se afastar.
      const dx = (event.clientX - rect.left) / rect.width - 0.5;
      const dy = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--tilt-y', `${dx * MAX_TILT * 2}deg`);
      el.style.setProperty('--tilt-x', `${-dy * MAX_TILT * 2}deg`);
    },
    [],
  );

  const handlePointerLeave = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }, []);

  return (
    // `figure` de verdade: a legenda ao lado é um `figcaption`, e ele só é HTML
    // válido dentro de uma figura. A composição continua invertendo o eixo do
    // bloco de cima — lá o texto à esquerda e a ficha à direita, aqui a legenda
    // numa coluna estreita à esquerda e o desenho nas nove restantes.
    <figure className="mt-16 grid gap-x-10 gap-y-6 sm:mt-20 lg:grid-cols-12">
      <figcaption
        data-reveal
        data-reveal-delay="1"
        className="border-t-2 border-paper-900 pt-3 dark:border-ink-100/80 lg:col-span-3"
      >
        <span className="cota block text-[11px] uppercase text-lumi-600 dark:text-lumi-200">
          {t('hero.cycle.caption.label')}
        </span>
        <p className="mt-2 text-[13px] leading-snug text-paper-600 dark:text-ink-400">
          {t('hero.cycle.caption.text')}
        </p>
      </figcaption>

      <div data-reveal data-reveal-delay="2" className="lg:col-span-9">
        <div
          ref={rootRef}
          className="lc"
          data-loan-cycle={running ? 'running' : 'paused'}
        >
          <div
            ref={stageRef}
            className="tilt-stage"
            onPointerMove={hasFinePointer ? handlePointerMove : undefined}
            onPointerLeave={hasFinePointer ? handlePointerLeave : undefined}
          >
            {/* Ficha, e não moldura de navegador: canto de 2px é PAPEL na
                hierarquia de raio da página, e é justamente por isso que este
                bloco não pode ser confundido com uma captura. As telas reais,
                lá embaixo, são as únicas coisas dentro de uma moldura de 12px. */}
            <div className="ficha paper-surface bg-paper-50 px-4 py-5 dark:bg-ink-900 sm:px-6 sm:py-6">
              {/* O desenho não recebe rótulo próprio: ele é a versão visual da
                  lista numerada logo abaixo, que é texto de verdade, traduzido,
                  selecionável e na ordem certa. Anunciar os dois faria a mesma
                  história ser lida duas vezes. */}
              <svg
                className="lc-svg"
                viewBox="0 0 1000 376"
                aria-hidden="true"
                focusable="false"
              >
                {/* ---------- A ESTANTE ---------- */}
                <g className="lc-shelf lc-run">
                  {/* Filete de 2px: a mesma divisória de gaveta de fichário que
                      marca todas as seções da página. */}
                  <rect
                    x="28"
                    y="264"
                    width="250"
                    height="3"
                    className="lc-rule"
                  />
                  {/* Lombadas altas de propósito: com estantes baixas o terço
                      esquerdo do desenho ficava vazio em cima e a composição
                      pendia toda para a direita, onde estão o celular e o
                      painel. Aqui as três massas têm altura parecida. */}
                  {[
                    { x: 36, w: 26, h: 168 },
                    { x: 64, w: 22, h: 146 },
                    { x: 88, w: 30, h: 186 },
                    { x: 170, w: 24, h: 156 },
                    { x: 196, w: 28, h: 180 },
                    { x: 226, w: 22, h: 142 },
                    { x: 250, w: 26, h: 164 },
                  ].map((s) => (
                    <g key={s.x}>
                      <rect
                        x={s.x}
                        y={264 - s.h}
                        width={s.w}
                        height={s.h}
                        rx="2"
                        className="lc-paper"
                      />
                      <rect
                        x={s.x + 5}
                        y="234"
                        width={s.w - 10}
                        height="20"
                        rx="1"
                        className="lc-fill-2"
                      />
                    </g>
                  ))}
                  {/* Cotas de Dewey de verdade, as mesmas da página: 025.3 é
                      catalogação e 027.8 é biblioteca escolar. Quem é da área
                      reconhece; quem não é lê como sistema de ordenação. */}
                  <text
                    x="103"
                    y="165"
                    className="lc-cota"
                    fontSize="9"
                    textAnchor="middle"
                    transform="rotate(-90 103 165)"
                  >
                    {SHELF_MARKS.features}
                  </text>
                  <text
                    x="210"
                    y="168"
                    className="lc-cota"
                    fontSize="9"
                    textAnchor="middle"
                    transform="rotate(-90 210 168)"
                  >
                    {SHELF_MARKS.hero}
                  </text>
                </g>

                {/* O vão que o exemplar emprestado deixa. Tracejado porque o
                    lugar continua reservado — o livro volta. */}
                <rect
                  x="120"
                  y="78"
                  width="46"
                  height="186"
                  rx="2"
                  className="lc-slot lc-run"
                />

                {/* ---------- O EXEMPLAR ---------- */}
                {/* Mais largo que as lombadas vizinhas de propósito: é o objeto
                    que a história inteira acompanha, e na proporção delas
                    (1:6) ele saía da estante lendo como régua, não como livro. */}
                <g className="lc-book lc-run">
                  <rect
                    x="120"
                    y="78"
                    width="38"
                    height="186"
                    rx="2"
                    className="lc-paper"
                  />
                  {/* Corte das folhas, do lado de fora da lombada: é o que faz
                      um retângulo em pé virar um livro. */}
                  <rect
                    x="158"
                    y="84"
                    width="8"
                    height="174"
                    rx="1"
                    className="lc-fill-2"
                  />
                  {/* Etiqueta de lombada. 025.6 é serviços de circulação —
                      empréstimo e devolução, que é exatamente o que este
                      exemplar está prestes a fazer. */}
                  <rect
                    x="127"
                    y="216"
                    width="24"
                    height="40"
                    rx="1"
                    className="lc-brand-fill"
                  />
                  <text
                    x="139"
                    y="236"
                    className="lc-cota lc-on-brand"
                    fontSize="10"
                    textAnchor="middle"
                    transform="rotate(-90 139 236)"
                  >
                    {SHELF_MARKS.screens}
                  </text>
                </g>

                {/* ---------- O APLICATIVO ---------- */}
                <g className="lc-phone lc-run">
                  <rect
                    x="410"
                    y="40"
                    width="124"
                    height="252"
                    rx="14"
                    className="lc-paper"
                  />
                  <rect
                    x="457"
                    y="54"
                    width="30"
                    height="5"
                    rx="2.5"
                    className="lc-fill-2"
                  />
                  <rect
                    x="420"
                    y="68"
                    width="104"
                    height="206"
                    rx="6"
                    className="lc-fill-2"
                  />
                  <rect
                    x="428"
                    y="76"
                    width="44"
                    height="6"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="428"
                    y="88"
                    width="88"
                    height="2"
                    className="lc-rule"
                  />
                  {APP_ROWS.map((y) => (
                    <g key={y}>
                      <rect
                        x="430"
                        y={y + 3}
                        width="14"
                        height="18"
                        rx="1"
                        className="lc-bar"
                      />
                      <rect
                        x="450"
                        y={y + 6}
                        width="58"
                        height="5"
                        rx="2"
                        className="lc-bar"
                      />
                      <rect
                        x="450"
                        y={y + 15}
                        width="38"
                        height="4"
                        rx="2"
                        className="lc-bar"
                      />
                    </g>
                  ))}
                </g>

                {/* O título que o aluno escolheu, marcado. O marcador é uma
                    FITA DE PÁGINA, não um coração: é o objeto que uma pessoa
                    usa quando quer voltar a um livro. */}
                <g className="lc-hit lc-run">
                  <rect
                    x="426"
                    y="124"
                    width="92"
                    height="32"
                    rx="3"
                    className="lc-tint"
                  />
                  <rect
                    x="426"
                    y="124"
                    width="3"
                    height="32"
                    className="lc-brand-fill"
                  />
                  <path
                    d="M504 127 h11 v20 l-5.5 -5.5 l-5.5 5.5 z"
                    className="lc-brand-fill"
                  />
                </g>

                {/* O pedido de empréstimo, feito no app. */}
                <g className="lc-cta lc-run">
                  <rect
                    x="428"
                    y="234"
                    width="88"
                    height="26"
                    rx="6"
                    className="lc-brand-fill"
                  />
                  <rect
                    x="450"
                    y="245"
                    width="44"
                    height="4"
                    rx="2"
                    className="lc-on-brand"
                  />
                </g>
                <circle
                  cx="472"
                  cy="247"
                  r="26"
                  className="lc-ring lc-tap lc-run"
                />

                {/* ---------- A PONTE ENTRE APP E SITE ---------- */}
                <path d="M538 182 H586" className="lc-bridge lc-run" />
                <rect
                  x="552"
                  y="180.5"
                  width="20"
                  height="3"
                  rx="1.5"
                  className="lc-brand-fill lc-back lc-run"
                />

                {/* A ficha do pedido: a única peça que atravessa a ponte, porque
                    é literalmente o que o aplicativo manda para o painel. */}
                <g className="lc-req lc-run">
                  <rect
                    x="502"
                    y="162"
                    width="64"
                    height="42"
                    rx="2"
                    className="lc-paper"
                  />
                  <rect
                    x="508"
                    y="169"
                    width="30"
                    height="4"
                    rx="2"
                    className="lc-brand-fill"
                  />
                  <rect
                    x="508"
                    y="179"
                    width="44"
                    height="3"
                    rx="1.5"
                    className="lc-bar"
                  />
                  <rect
                    x="508"
                    y="187"
                    width="36"
                    height="3"
                    rx="1.5"
                    className="lc-bar"
                  />
                </g>

                {/* ---------- O PAINEL ---------- */}
                <g className="lc-browser lc-run">
                  {/* Raio de 12px: tela. É a única coisa arredondada assim no
                      desenho, pela mesma hierarquia da `BrowserFrame`. */}
                  <rect
                    x="590"
                    y="58"
                    width="378"
                    height="252"
                    rx="12"
                    className="lc-paper"
                  />
                  <rect
                    x="591"
                    y="92"
                    width="376"
                    height="1.5"
                    className="lc-hairline"
                  />
                  <circle cx="610" cy="75" r="4.5" className="lc-bar" />
                  <circle cx="626" cy="75" r="4.5" className="lc-bar" />
                  <circle cx="642" cy="75" r="4.5" className="lc-bar" />
                  {/* Rota real do painel, como na moldura das capturas: é a
                      tela em que a bibliotecária aprova de verdade. */}
                  <text x="660" y="79.5" className="lc-cota" fontSize="11">
                    /admin/loans
                  </text>
                  <rect
                    x="610"
                    y="108"
                    width="70"
                    height="5"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="756"
                    y="108"
                    width="48"
                    height="5"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="880"
                    y="108"
                    width="40"
                    height="5"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="610"
                    y="122"
                    width="338"
                    height="2.5"
                    className="lc-rule"
                  />
                  {WEB_ROWS.map((cy) => (
                    <g key={cy}>
                      <rect
                        x="610"
                        y={cy - 4}
                        width="112"
                        height="7"
                        rx="2"
                        className="lc-bar"
                      />
                      <rect
                        x="756"
                        y={cy - 3}
                        width="76"
                        height="6"
                        rx="2"
                        className="lc-bar"
                      />
                      <rect
                        x="880"
                        y={cy - 8}
                        width="56"
                        height="16"
                        rx="8"
                        className="lc-fill-2"
                      />
                    </g>
                  ))}
                  <rect
                    x="610"
                    y="168"
                    width="338"
                    height="1"
                    className="lc-hairline"
                  />
                  <rect
                    x="610"
                    y="206"
                    width="338"
                    height="1"
                    className="lc-hairline"
                  />
                  <rect
                    x="610"
                    y="244"
                    width="338"
                    height="1"
                    className="lc-hairline"
                  />
                </g>

                {/* A solicitação que acabou de chegar do aplicativo. Ela não
                    existe na tabela antes da batida 5 — por isso é desenhada
                    fora do grupo do painel. */}
                <g className="lc-newrow lc-run">
                  <rect
                    x="598"
                    y="170"
                    width="362"
                    height="34"
                    className="lc-tint"
                  />
                  <rect
                    x="598"
                    y="170"
                    width="3"
                    height="34"
                    className="lc-brand-fill"
                  />
                  <rect
                    x="610"
                    y="183"
                    width="112"
                    height="7"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="756"
                    y="184"
                    width="76"
                    height="6"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="880"
                    y="179"
                    width="56"
                    height="16"
                    rx="8"
                    className="lc-brand-fill"
                  />
                  <circle cx="891" cy="187" r="3" className="lc-on-brand" />
                  <rect
                    x="899"
                    y="184.5"
                    width="28"
                    height="5"
                    rx="2.5"
                    className="lc-on-brand"
                  />
                </g>

                {/* O carimbo. Rotação estática por atributo no grupo de fora e
                    escala animada no de dentro: transform de CSS substituiria o
                    atributo se os dois vivessem no mesmo elemento. */}
                <g transform="rotate(-9 806 187)">
                  <g className="lc-stamp lc-run">
                    <rect
                      x="748"
                      y="163"
                      width="116"
                      height="48"
                      rx="3"
                      className="lc-brand-stroke"
                    />
                    <rect
                      x="756"
                      y="171"
                      width="100"
                      height="32"
                      rx="2"
                      className="lc-brand-thin"
                    />
                    <path
                      d="M770 188 l9 9 l17 -19"
                      className="lc-brand-stroke"
                    />
                    {/* A pauta do prazo de devolução, como num carimbo de data
                        de biblioteca. */}
                    <rect
                      x="806"
                      y="192"
                      width="42"
                      height="2.5"
                      className="lc-brand-fill"
                    />
                  </g>
                </g>

                {/* ---------- O ALUNO ---------- */}
                <g className="lc-reader lc-run">
                  <rect
                    x="282"
                    y="344"
                    width="284"
                    height="3"
                    className="lc-rule"
                  />
                  <rect
                    x="370"
                    y="290"
                    width="150"
                    height="54"
                    rx="2"
                    className="lc-paper"
                  />
                  <rect
                    x="380"
                    y="298"
                    width="34"
                    height="34"
                    rx="1"
                    className="lc-brand-fill"
                  />
                  <rect
                    x="424"
                    y="302"
                    width="84"
                    height="4"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="424"
                    y="312"
                    width="64"
                    height="4"
                    rx="2"
                    className="lc-bar"
                  />
                  <rect
                    x="424"
                    y="322"
                    width="48"
                    height="4"
                    rx="2"
                    className="lc-bar"
                  />
                  {/* Furo do bastão do fichário, o mesmo detalhe da ficha de
                      catálogo do bloco de cima. */}
                  <circle cx="445" cy="336" r="4.5" className="lc-paper" />
                </g>
              </svg>
            </div>
          </div>

          {/* A história em texto de verdade. Com movimento, uma legenda por vez,
              no compasso do desenho; sem movimento, as seis de uma vez, como a
              tira de um storyboard. Quem usa leitor de tela recebe sempre as
              seis, na ordem — que é mais do que a tela mostra. */}
          <ol
            className="lc-steps mt-5"
            aria-label={t('hero.cycle.steps.aria')}
          >
            {STEPS.map((key, index) => (
              <li key={key} className="lc-run flex items-baseline gap-x-3">
                {/* A numeração já vem do `ol`; repeti-la em voz alta antes de
                    cada frase só atrapalha. Aqui ela é sinal visual. */}
                <span
                  aria-hidden="true"
                  className="cota shrink-0 text-[11px] text-lumi-600 dark:text-lumi-300"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] leading-snug text-paper-700 dark:text-ink-200">
                  {t(`hero.cycle.step.${key}`)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  );
}
