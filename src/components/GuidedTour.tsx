import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';

interface TourStep {
  /** Optional CSS selector for the highlighted target. Absent = centered card. */
  selector?: string;
  titleKey: string;
  bodyKey: string;
}

const STEPS: TourStep[] = [
  { titleKey: 'tour.welcome.title', bodyKey: 'tour.welcome.body' },
  { selector: '[data-tour="sidebar"]', titleKey: 'tour.sidebar.title', bodyKey: 'tour.sidebar.body' },
  { selector: '[data-tour="global-search"]', titleKey: 'tour.search.title', bodyKey: 'tour.search.body' },
  { selector: '[data-tour="notifications"]', titleKey: 'tour.notifications.title', bodyKey: 'tour.notifications.body' },
  { titleKey: 'tour.settings.title', bodyKey: 'tour.settings.body' },
  { titleKey: 'tour.finish.title', bodyKey: 'tour.finish.body' },
];

const PAD = 8;
const CARD_W = 340;

export function GuidedTour() {
  const { user, completeTour } = useAuth();
  const { t } = useTranslation('common');
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const shouldShow =
    !!user && user.guidedTourCompleted === false && !user.isInitialPassword && !dismissed;

  const current = STEPS[step];

  const measure = useCallback(() => {
    if (!current?.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(current.selector);
    const r = el?.getBoundingClientRect();
    // Alvo ausente ou oculto (largura/altura 0, ex.: search em mobile) => card centralizado.
    setRect(r && r.width > 0 && r.height > 0 ? r : null);
  }, [current]);

  // Mede o alvo do passo atual (e re-mede em resize/scroll).
  useLayoutEffect(() => {
    if (!shouldShow) return;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [shouldShow, measure]);

  const finish = useCallback(() => {
    setDismissed(true);
    completeTour();
  }, [completeTour]);

  const next = useCallback(() => {
    setStep((s) => (s >= STEPS.length - 1 ? s : s + 1));
  }, []);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') {
        if (step >= STEPS.length - 1) finish();
        else next();
      } else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shouldShow, step, next, back, finish]);

  const cardStyle = useMemo<React.CSSProperties>(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!rect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: Math.min(CARD_W, vw - 2 * PAD),
      };
    }
    const width = Math.min(CARD_W, vw - 2 * PAD);
    // Prefere abaixo do alvo; se não couber, acima.
    const below = rect.bottom + PAD;
    const placeAbove = below + 180 > vh && rect.top - PAD - 180 > 0;
    const top = placeAbove ? Math.max(PAD, rect.top - PAD - 180) : below;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(PAD, Math.min(left, vw - width - PAD));
    return { top, left, width };
  }, [rect]);

  if (!shouldShow) return null;

  const isLast = step >= STEPS.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[9998] animate-fade-in" aria-hidden={false}>
      {/* Spotlight: um retângulo transparente com box-shadow gigante escurece o resto. */}
      {rect ? (
        <div
          className="absolute rounded-xl transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            border: '2px solid rgb(150 32 117)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={t(current.titleKey)}
        className="absolute rounded-2xl bg-white dark:bg-dark-card shadow-glow p-5 border border-gray-200/70 dark:border-white/10"
        style={cardStyle}
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-lumi-primary dark:text-lumi-label">
          {t('tour.step_of', { current: step + 1, total: STEPS.length })}
        </div>
        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mt-1">
          {t(current.titleKey)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
          {t(current.bodyKey)}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t('tour.skip')}
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="px-3 h-9 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-200 hover:border-lumi-primary"
              >
                {t('tour.back')}
              </button>
            )}
            <button
              type="button"
              onClick={isLast ? finish : next}
              className="px-4 h-9 rounded-lg bg-lumi-primary hover:bg-lumi-primary/90 text-white text-sm font-bold shadow-sm"
            >
              {isLast ? t('tour.finish') : t('tour.next')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
