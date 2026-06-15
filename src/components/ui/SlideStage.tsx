import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

interface SlideStageProps {
  views: ReactNode[];
  currentIndex: number;
  instant?: boolean;
  duration?: number;
  easing?: string;
  onTransitionEnd?: () => void;
  className?: string;
  trackClassName?: string;
  itemClassName?: string;
  viewDataAttribute?: string;
  viewDataValues?: string[];
}

const DEFAULT_DURATION_MS = 450;
const DEFAULT_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Stage de slide horizontal entre views. O track desliza com translateX e
 * transição CSS — o mesmo "arrastado" usado no toggle do Dashboard e em
 * Livros → Exemplares.
 *
 * A transição acompanha o restante da UI (sidebar, toggle, modais), que anima
 * incondicionalmente. `instant` desliga a transição em resets programáticos
 * (ex.: trocar de rota não deve arrastar o conteúdo interno).
 */
export function SlideStage({
  views,
  currentIndex,
  instant = false,
  duration = DEFAULT_DURATION_MS,
  easing = DEFAULT_EASING,
  onTransitionEnd,
  className = '',
  trackClassName = '',
  itemClassName = '',
  viewDataAttribute,
  viewDataValues,
}: SlideStageProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const skipNextTransitionRef = useRef(instant);

  const safeIndex = Math.min(Math.max(currentIndex, 0), views.length - 1);
  const shouldAnimate = !skipNextTransitionRef.current;
  const transitionStyle: CSSProperties['transition'] = shouldAnimate
    ? `transform ${duration}ms ${easing}`
    : 'none';

  useEffect(() => {
    if (skipNextTransitionRef.current) {
      skipNextTransitionRef.current = false;
    }
  }, [safeIndex]);

  useEffect(() => {
    if (instant) {
      skipNextTransitionRef.current = true;
    }
  }, [instant]);

  return (
    <div className={`relative flex flex-col overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        data-slide-track="true"
        className={`flex w-full min-h-0 grow ${trackClassName}`}
        style={{
          transform: `translateX(-${safeIndex * 100}%)`,
          transition: transitionStyle,
        }}
        onTransitionEnd={(event) => {
          if (event.target !== trackRef.current) return;
          onTransitionEnd?.();
        }}
      >
        {views.map((view, index) => {
          const isHidden = index !== safeIndex;
          return (
            <div
              key={index}
              className={`flex w-full shrink-0 flex-col ${isHidden ? 'pointer-events-none' : ''} ${itemClassName}`}
              aria-hidden={isHidden}
              inert={isHidden ? true : undefined}
              {...(viewDataAttribute && viewDataValues?.[index]
                ? { [`data-${viewDataAttribute}`]: viewDataValues[index] }
                : {})}
            >
              {view}
            </div>
          );
        })}
      </div>
    </div>
  );
}
