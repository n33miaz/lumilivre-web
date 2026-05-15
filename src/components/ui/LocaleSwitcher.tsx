import { useLocale } from '../../contexts/LocaleContext';
import type { SupportedLocale } from '../../i18n';

const LABELS: Record<SupportedLocale, string> = {
  'pt-BR': 'PT',
  'en-US': 'EN',
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggle = () => setLocale(locale === 'pt-BR' ? 'en-US' : 'pt-BR');

  return (
    <button
      onClick={toggle}
      aria-label="Switch language"
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {Object.entries(LABELS).map(([key, label]) => (
        <span
          key={key}
          className={
            locale === key
              ? 'text-lumi-primary dark:text-lumi-label underline underline-offset-2'
              : 'opacity-50'
          }
        >
          {label}
        </span>
      ))}
    </button>
  );
}
