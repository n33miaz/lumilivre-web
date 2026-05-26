import { useTranslation } from 'react-i18next';

import type { DashboardView } from '../../hooks/useDashboardViewAlerts';

interface DashboardViewToggleProps {
  value: DashboardView;
  onChange: (next: DashboardView) => void;
  analyticsHasNews: boolean;
  tablesHasNews: boolean;
}

interface ToggleOption {
  view: DashboardView;
  label: string;
  hasNews: boolean;
}

export function DashboardViewToggle({
  value,
  onChange,
  analyticsHasNews,
  tablesHasNews,
}: DashboardViewToggleProps) {
  const { t } = useTranslation('dashboard');

  const options: ToggleOption[] = [
    {
      view: 'analytics',
      label: t('view_toggle.analytics'),
      hasNews: analyticsHasNews,
    },
    {
      view: 'tables',
      label: t('view_toggle.tables'),
      hasNews: tablesHasNews,
    },
  ];

  const newsHint = t('view_toggle.news_indicator');

  return (
    <div
      role="group"
      aria-label={t('view_toggle.aria_label')}
      className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800/80 p-1 shadow-inner print:hidden"
    >
      {options.map((option) => {
        const isActive = option.view === value;
        const ariaLabel = option.hasNews
          ? `${option.label} — ${newsHint}`
          : option.label;

        return (
          <button
            key={option.view}
            type="button"
            onClick={() => onChange(option.view)}
            aria-pressed={isActive}
            aria-label={ariaLabel}
            className={`
              relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold
              transition-all duration-300 ease-out
              focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-primary focus-visible:ring-offset-2
              focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-800
              ${
                isActive
                  ? 'bg-white dark:bg-lumi-primary text-lumi-primary dark:text-white shadow-md scale-[1.02]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
              }
            `}
          >
            <span className="whitespace-nowrap">{option.label}</span>
            {option.hasNews && (
              <span
                aria-hidden="true"
                className="relative flex h-2 w-2"
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
