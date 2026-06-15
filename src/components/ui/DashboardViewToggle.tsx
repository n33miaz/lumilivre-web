import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DashboardView } from '../../hooks/useDashboardViewAlerts';

export type DashboardTablesAlert = 'none' | 'overdue' | 'requests';

interface DashboardViewToggleProps {
  value: DashboardView;
  onChange: (next: DashboardView) => void;
  analyticsHasNews: boolean;
  tablesHasNews: boolean;
  /** Semantic alert for the tables view: red = requests, amber = overdue. */
  tablesAlert?: DashboardTablesAlert;
}

const DOT = {
  red: { ping: 'bg-red-400', core: 'bg-red-500' },
  amber: { ping: 'bg-amber-300', core: 'bg-amber-400' },
} as const;

export function DashboardViewToggle({
  value,
  onChange,
  analyticsHasNews,
  tablesHasNews,
  tablesAlert,
}: DashboardViewToggleProps) {
  const { t } = useTranslation('dashboard');
  const newsHint = t('view_toggle.news_indicator');

  // Absolute counts win; otherwise fall back to the "news since baseline" dot.
  const tablesLevel: DashboardTablesAlert =
    tablesAlert ?? (tablesHasNews ? 'requests' : 'none');

  const options = [
    {
      view: 'analytics' as const,
      label: t('view_toggle.analytics'),
      hasNews: analyticsHasNews,
      dot: 'red' as keyof typeof DOT,
    },
    {
      view: 'tables' as const,
      label: t('view_toggle.tables'),
      hasNews: tablesLevel !== 'none',
      dot: (tablesLevel === 'overdue' ? 'amber' : 'red') as keyof typeof DOT,
    },
  ];

  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const activeIndex = value === 'analytics' ? 0 : 1;

  useLayoutEffect(() => {
    const measure = () => {
      const btn = btnRefs.current[activeIndex];
      if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex]);

  return (
    <div
      role="group"
      aria-label={t('view_toggle.aria_label')}
      className="relative inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800/80 p-1 shadow-inner print:hidden"
    >
      {/* Sliding indicator (the "dragged" feel between options) */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-1 bottom-1 rounded-full bg-white dark:bg-lumi-primary shadow-md transition-[transform,width] duration-300 ease-out"
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
        }}
      />
      {options.map((option, index) => {
        const isActive = option.view === value;
        const ariaLabel = option.hasNews
          ? `${option.label} — ${newsHint}`
          : option.label;
        const dot = DOT[option.dot];

        return (
          <button
            key={option.view}
            ref={(el) => {
              btnRefs.current[index] = el;
            }}
            type="button"
            onClick={() => onChange(option.view)}
            aria-pressed={isActive}
            aria-label={ariaLabel}
            className={`
              relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold
              transition-colors duration-300 ease-out
              focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-primary focus-visible:ring-offset-2
              focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-800
              ${
                isActive
                  ? 'text-lumi-primary dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <span className="whitespace-nowrap">{option.label}</span>
            {option.hasNews && (
              <span aria-hidden="true" className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dot.ping}`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${dot.core}`}
                />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
