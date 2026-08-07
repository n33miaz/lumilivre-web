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
 * O print de verdade do painel, logo abaixo da proposta de valor. Reaproveita a
 * MESMA captura da vitrine (ver `prints.ts`), então não custa nenhum byte a mais.
 *
 * A composição inverte o eixo do bloco de cima: lá o texto está à esquerda e a
 * ficha à direita; aqui a legenda fica numa coluna estreita à esquerda e o print
 * ocupa as nove colunas restantes. Alternar de que lado o peso cai é o que dá
 * **ritmo** — duas seções seguidas com o mesmo eixo viram parede.
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
    // `figure` de verdade: a legenda ao lado é um `figcaption`, e ele só é HTML
    // válido dentro de uma figura.
    <figure className="mt-16 grid gap-x-10 gap-y-6 sm:mt-20 lg:grid-cols-12">
      {/* Legenda de figura, como numa página impressa: fica ao lado da imagem,
          não embaixo de um título centralizado. */}
      <figcaption
        data-reveal
        data-reveal-delay="1"
        className="border-t-2 border-paper-900 pt-3 dark:border-ink-100/80 lg:col-span-3"
      >
        <span className="cota block text-[11px] uppercase text-lumi-600 dark:text-lumi-200">
          {t('hero.shot.caption.label')}
        </span>
        <p className="mt-2 text-[13px] leading-snug text-paper-600 dark:text-ink-400">
          {t('hero.shot.caption.text')}
        </p>
      </figcaption>

      <div
        data-reveal
        data-reveal-delay="2"
        className="relative lg:col-span-9"
      >
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
    </figure>
  );
}
