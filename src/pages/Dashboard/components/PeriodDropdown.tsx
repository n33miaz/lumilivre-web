import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown } from 'lucide-react';

import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';

export type DashboardPeriod = '30d' | '60d' | '90d' | 'ytd' | 'custom';

export interface CustomRange {
  start: string;
  end: string;
}

const PRESETS: Exclude<DashboardPeriod, 'custom'>[] = [
  '30d',
  '60d',
  '90d',
  'ytd',
];

interface PeriodDropdownProps {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
  customRange: CustomRange;
  onCustomRangeChange: (range: CustomRange) => void;
}

const formatShort = (iso: string) => {
  const [, month, day] = iso.split('-');
  return day && month ? `${day}/${month}` : iso;
};

export function PeriodDropdown({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: PeriodDropdownProps) {
  const { t } = useTranslation('dashboard');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CustomRange>(customRange);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(customRange), [customRange]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (containerRef.current?.contains(target)) return;
      // Clicks inside the date-picker portal (rendered to <body>) must not close us.
      if (target.closest('[id^="datepicker-portal"]')) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasCustomRange = Boolean(customRange.start && customRange.end);
  const currentLabel =
    value === 'custom'
      ? hasCustomRange
        ? `${formatShort(customRange.start)} – ${formatShort(customRange.end)}`
        : t('section.management.period.custom')
      : t(`section.management.period.${value}`);

  const applyCustom = () => {
    if (!draft.start || !draft.end) return;
    onCustomRangeChange(draft);
    onChange('custom');
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('section.management.period.aria')}
        className="h-9 px-3.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-lumi-primary hover:text-lumi-primary inline-flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        <span className="max-w-[150px] truncate">{currentLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 z-50 mt-2 w-64 max-w-[calc(100vw_-_2.5rem)] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card shadow-lg p-2 animate-slide-down">
          <div className="space-y-0.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onChange(preset);
                  setOpen(false);
                }}
                className={`row-hover w-full text-left px-3 py-2 rounded-lg text-sm ${
                  value === preset
                    ? 'bg-lumi-primary/10 text-lumi-primary font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {t(`section.management.period.${preset}`)}
              </button>
            ))}
          </div>

          <div className="my-2 border-t border-gray-100 dark:border-white/10" />

          <div className="px-1 pb-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              {t('section.management.period.custom')}
            </div>
            <div className="space-y-2">
              <CustomDatePicker
                label={t('section.management.period.start')}
                value={draft.start}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, start: event.target.value }))
                }
              />
              <CustomDatePicker
                label={t('section.management.period.end')}
                value={draft.end}
                min={draft.start || undefined}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, end: event.target.value }))
                }
              />
              <button
                type="button"
                onClick={applyCustom}
                disabled={!draft.start || !draft.end}
                className="w-full h-9 rounded-lg bg-lumi-gradient text-white text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('section.management.period.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
