import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * YouTube-style search: text field + a gray, clickable magnifier button on the
 * right. The focus ring wraps the whole control (focus-within) so it renders on
 * top instead of being clipped behind the button at the corners.
 */
export function TableSearch({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  className = '',
}: TableSearchProps) {
  const { t } = useTranslation('common');

  return (
    <div
      className={`relative flex items-stretch rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 transition focus-within:border-lumi-primary focus-within:ring-2 focus-within:ring-lumi-primary ${className}`}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder ?? t('search')}
        aria-label={t('aria.search')}
        className="h-11 flex-1 rounded-l-xl bg-transparent pl-4 pr-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
      />

      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('action.clear_search')}
          title={t('action.clear_search')}
          className="flex items-center px-2 text-gray-400 transition-colors hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onSubmit}
        aria-label={t('aria.search')}
        className="flex items-center rounded-r-xl border-l border-gray-200 bg-gray-100 px-4 text-lumi-primary transition-colors hover:bg-gray-200 active:bg-gray-300 dark:border-white/10 dark:bg-white/10 dark:text-lumi-label dark:hover:bg-white/20"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
}
