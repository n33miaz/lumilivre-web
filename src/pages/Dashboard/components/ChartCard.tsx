import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  total?: number | null;
  totalLabel?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  children: ReactNode;
}

export function ChartCard({
  title,
  total,
  totalLabel,
  isLoading = false,
  isEmpty = false,
  emptyMessage,
  emptyIcon,
  children,
}: ChartCardProps) {
  const showBadge = typeof total === 'number' && Number.isFinite(total);

  return (
    <div
      className="h-72 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-dark-card p-3 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <header className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
          {title}
        </h3>
        {showBadge && (
          <span
            title={totalLabel}
            className="inline-flex items-center gap-1 rounded-full bg-lumi-primary/10 dark:bg-lumi-primary/25 text-lumi-primary dark:text-lumi-label text-[10px] font-semibold px-2 py-0.5 select-none"
          >
            {totalLabel && (
              <span className="opacity-75 hidden sm:inline">{totalLabel}</span>
            )}
            <span className="tabular-nums">{total}</span>
          </span>
        )}
      </header>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <ChartSkeleton />
        ) : isEmpty ? (
          <ChartEmpty icon={emptyIcon} message={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="h-full w-full flex items-end justify-around gap-2 px-2 pb-2 animate-pulse"
    >
      {[60, 80, 45, 95, 70, 55].map((h, i) => (
        <span
          key={i}
          className="block w-full rounded-t bg-gray-200 dark:bg-gray-700"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function ChartEmpty({
  icon,
  message,
}: {
  icon?: ReactNode;
  message?: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-sm text-gray-400 dark:text-gray-500 gap-2">
      {icon ?? <DefaultEmptyIcon />}
      {message && <span>{message}</span>}
    </div>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg
      aria-hidden="true"
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-300 dark:text-gray-600"
    >
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-5" />
    </svg>
  );
}
