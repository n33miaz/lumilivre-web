import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BrowserFrame } from './BrowserFrame';
import { PrintPicture } from './PrintPicture';
import { PRINTS } from './prints';

/** Amplitude da inclinação, em graus. Acima disso o print começa a distorcer. */
const MAX_TILT = 4;

/**
 * O print de verdade do painel, logo abaixo da proposta de valor.
 *
 * Substitui o mock desenhado à mão que vivia aqui: números e nomes de leitores
 * inventados, a poucos pixels da vitrine que mostra as telas reais — o contraste
 * fazia o conjunto parecer template. Reaproveita a MESMA captura da vitrine
 * (ver `prints.ts`), então o hero não custa nenhum byte a mais.
 *
 * A inclinação segue o ponteiro por variáveis CSS escritas via CSSOM, como no
 * `buttonLight` dos botões do login: `transform` puro, sem animar layout, e
 * ligada só onde existe ponteiro fino de verdade.
 */
export function HeroShot() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();
  const hasFinePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const stageRef = useRef<HTMLDivElement>(null);

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
    <div
      data-reveal
      data-reveal-delay="4"
      className="relative mx-auto mt-14 max-w-5xl sm:mt-16"
    >
      {/* Brilho de apoio: fica atrás do print e some no claro para não lavar a
          borda da moldura. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -top-6 bottom-8 rounded-[36px] bg-lumi-400/10 blur-3xl dark:bg-lumi-500/20"
      />
      <div
        ref={stageRef}
        className="tilt-stage relative"
        onPointerMove={hasFinePointer ? handlePointerMove : undefined}
        onPointerLeave={hasFinePointer ? handlePointerLeave : undefined}
      >
        <BrowserFrame path={PRINTS.dashboard.path}>
          <PrintPicture
            print={PRINTS.dashboard}
            isDark={isDark}
            alt={t('hero.shot.alt')}
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </BrowserFrame>
      </div>
    </div>
  );
}
