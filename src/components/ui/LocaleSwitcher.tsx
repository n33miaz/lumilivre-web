import { type KeyboardEvent, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

import { LOCALES, type SupportedLocale } from '../../i18n';
import { usePresence } from '../../hooks/usePresence';
import { useLocaleMenu, type PlacementToken } from './localeMenu';

type LegacyPlacement = 'top' | 'bottom';

interface LocaleSwitcherProps {
  placement?: PlacementToken | LegacyPlacement;
}

interface LocaleMenuProps {
  ariaLabel: string;
  className?: string;
  locale: SupportedLocale;
  focusedIndex: number;
  itemRefs: MutableRefObject<Array<HTMLLIElement | null>>;
  placementClassName: string;
  onSelect: (code: SupportedLocale) => void;
  onKeyDown: (event: KeyboardEvent<HTMLUListElement>) => void;
}

export function LocaleMenu({
  ariaLabel,
  className = '',
  locale,
  focusedIndex,
  itemRefs,
  placementClassName,
  onSelect,
  onKeyDown,
}: LocaleMenuProps) {
  return (
    <ul
      role="listbox"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={`absolute z-[60] min-w-[156px] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-card py-1 ${placementClassName} ${className}`}
    >
      {LOCALES.map((item, index) => {
        const isSelected = item.code === locale;
        return (
          <li
            key={item.code}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            role="option"
            aria-selected={isSelected}
            tabIndex={focusedIndex === index ? 0 : -1}
            onClick={() => onSelect(item.code)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(item.code);
              }
            }}
            className={`row-hover flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
              isSelected
                ? 'text-lumi-primary dark:text-lumi-label font-semibold'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <span>{item.label}</span>
            <span className="text-xs opacity-60">{item.short}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function LocaleSwitcher({
  placement = 'auto',
}: LocaleSwitcherProps = {}) {
  const { t } = useTranslation('common');
  const ariaLabel = t('locale.switch_aria');
  const {
    open,
    setOpen,
    focusedIndex,
    locale,
    current,
    containerRef,
    buttonRef,
    itemRefs,
    placementClassName,
    select,
    handleListKeyDown,
  } = useLocaleMenu({ placement });
  const { shouldRender, isClosing } = usePresence(open);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-9 items-center gap-2 px-3 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-lumi-primary/10 hover:text-lumi-primary dark:hover:bg-white/10 dark:hover:text-lumi-label active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-primary transition-all duration-200 ease-out"
      >
        <Languages className="h-4 w-4" />
        <span className="text-lumi-primary dark:text-lumi-label">
          {current.short}
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {shouldRender && (
        <LocaleMenu
          ariaLabel={ariaLabel}
          locale={locale}
          focusedIndex={focusedIndex}
          itemRefs={itemRefs}
          placementClassName={placementClassName}
          className={isClosing ? 'animate-slide-down-out' : 'animate-slide-down'}
          onSelect={select}
          onKeyDown={handleListKeyDown}
        />
      )}
    </div>
  );
}
