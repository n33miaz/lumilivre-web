import { useTranslation } from 'react-i18next';

import {
  LocaleMenu,
} from '../../components/ui/LocaleSwitcher';
import { useLocaleMenu } from '../../components/ui/localeMenu';

interface SidebarLocaleSwitcherProps {
  isExpanded: boolean;
}

export function SidebarLocaleSwitcher({
  isExpanded,
}: SidebarLocaleSwitcherProps) {
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
  } = useLocaleMenu({ placement: 'right-end' });

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`
          nav-pill flex w-full items-center justify-center rounded-xl p-3 text-gray-200
          transition-colors duration-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
          ${open ? 'bg-white/15 text-white' : ''}
        `}
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-extrabold text-lumi-label ring-1 ring-white/10">
          {current.short}
        </span>

        <span
          className={`overflow-hidden transition-all duration-200 ${
            isExpanded ? 'ml-4 w-40' : 'w-0'
          }`}
        >
          <span className="flex items-center justify-between gap-3 whitespace-nowrap text-left text-sm font-semibold">
            <span className="truncate">{current.label}</span>
            <svg
              className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                open ? 'rotate-180' : ''
              }`}
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
          </span>
        </span>
      </button>

      {open && (
        <LocaleMenu
          ariaLabel={ariaLabel}
          locale={locale}
          focusedIndex={focusedIndex}
          itemRefs={itemRefs}
          placementClassName={placementClassName}
          onSelect={select}
          onKeyDown={handleListKeyDown}
        />
      )}
    </div>
  );
}
