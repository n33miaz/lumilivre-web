import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { usePresence } from '../../hooks/usePresence';

interface FilterPanelProps {
  isOpen: boolean;
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  width?: string;
}

export function FilterPanel({
  isOpen,
  children,
  onApply,
  onClear,
  onClose,
  width = 'md:w-[600px]', // Valor padrão agora inclui o prefixo md:
}: FilterPanelProps) {
  const { t } = useTranslation('common');
  const { shouldRender, isClosing } = usePresence(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Element;
      const toggleButton = document.getElementById('filter-toggle-button');

      const isInsideDropdownPortal = target.closest('[id^="dropdown-portal-"]');
      const isInsideDatePickerPortal = target.closest(
        '[id^="datepicker-portal-"]',
      );

      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        toggleButton &&
        !toggleButton.contains(target) &&
        !isInsideDropdownPortal &&
        !isInsideDatePickerPortal
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute top-full -right-2 mt-2 origin-top-right bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[70] select-none
        w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] max-w-[95vw] ${width}
        ${isClosing ? 'animate-slide-down-out' : 'animate-slide-down'}
        `}
    >
      <div className="p-4 md:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
        {children}

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClear}
            className="font-semibold py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {t('clear')}
          </button>
          <button
            onClick={onApply}
            className="bg-lumi-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-lumi-primary-hover transform hover:scale-105 shadow-md"
          >
            {t('apply_filters')}
          </button>
        </div>
      </div>
    </div>
  );
}
