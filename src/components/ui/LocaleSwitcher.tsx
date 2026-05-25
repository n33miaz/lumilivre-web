import { useEffect, useRef, useState } from 'react';

import { useLocale } from '../../contexts/LocaleContext';
import { LOCALES, type SupportedLocale } from '../../i18n';

interface LocaleSwitcherProps {
  placement?: 'top' | 'bottom';
}

export function LocaleSwitcher({ placement = 'top' }: LocaleSwitcherProps = {}) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const activeIndex = LOCALES.findIndex((l) => l.code === locale);
    setFocusedIndex(activeIndex >= 0 ? activeIndex : 0);
  }, [open, locale]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[focusedIndex]?.focus();
  }, [open, focusedIndex]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const select = (code: SupportedLocale) => {
    setLocale(code);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % LOCALES.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev === 0 ? LOCALES.length - 1 : prev - 1,
        );
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(LOCALES.length - 1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-lumi-primary dark:text-lumi-label">
          {current.short}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
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

      {open && (
        <ul
          role="listbox"
          aria-label="Switch language"
          onKeyDown={handleListKeyDown}
          className={`absolute right-0 z-50 min-w-[140px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 ${
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
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
                onClick={() => select(item.code)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    select(item.code);
                  }
                }}
                className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer outline-none focus:bg-gray-100 dark:focus:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
      )}
    </div>
  );
}
