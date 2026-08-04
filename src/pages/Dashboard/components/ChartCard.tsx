import type { ReactNode } from 'react';

interface ChartCardProps {
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  children: ReactNode;
}

export function ChartCard({
  eyebrow,
  title,
  badge,
  isLoading = false,
  isEmpty = false,
  isError = false,
  errorMessage,
  onRetry,
  retryLabel,
  emptyMessage,
  emptyIcon,
  children,
}: ChartCardProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase truncate">
              {eyebrow}
            </div>
          )}
          <div className="font-display font-bold text-lg mt-0.5 text-gray-900 dark:text-white truncate">
            {title}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      <div className="h-56 flex-1 min-h-0">
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <ChartError message={errorMessage} onRetry={onRetry} retryLabel={retryLabel} />
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

function ChartError({
  message,
  onRetry,
  retryLabel,
}: {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="h-full flex flex-col items-center justify-center text-sm text-red-500 dark:text-red-400 gap-2 text-center px-4"
    >
      <svg
        aria-hidden="true"
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      {message && <span>{message}</span>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 px-3 h-8 rounded-lg border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-300 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          {retryLabel ?? 'Tentar novamente'}
        </button>
      )}
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
