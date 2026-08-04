import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { usePresence } from '../../hooks/usePresence';

interface FilterPanelProps {
  isOpen: boolean;
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  /** Largura máxima em px do painel (default 600). */
  width?: number;
}

const GAP = 8;
const MARGIN = 16;

export function FilterPanel({
  isOpen,
  children,
  onApply,
  onClear,
  onClose,
  width = 600,
}: FilterPanelProps) {
  const { t } = useTranslation('common');
  const { shouldRender, isClosing } = usePresence(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Posiciona o painel ancorado ao gatilho (#filter-toggle-button), alinhado à
  // direita. Portalado em document.body (position: fixed) para NUNCA ser cortado
  // por overflow/transform de ancestrais (bug do SlideStage no Books).
  useLayoutEffect(() => {
    if (!shouldRender) return;

    const reposition = () => {
      const trigger = document.getElementById('filter-toggle-button');
      const vw = window.innerWidth;
      const panelWidth = Math.min(width, vw - 2 * MARGIN);
      if (!trigger) {
        setPos({ top: 72, left: vw - panelWidth - MARGIN, width: panelWidth });
        return;
      }
      const r = trigger.getBoundingClientRect();
      const top = r.bottom + GAP;
      let left = r.right - panelWidth;
      left = Math.max(MARGIN, Math.min(left, vw - panelWidth - MARGIN));
      setPos({ top, left, width: panelWidth });
    };

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [shouldRender, width]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Element;
      const toggleButton = document.getElementById('filter-toggle-button');

      const isInsideDropdownPortal = target.closest('[id^="dropdown-portal-"]');
      const isInsideDatePickerPortal = target.closest('[id^="datepicker-portal-"]');

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

  if (!shouldRender || !pos) return null;

  return createPortal(
    <div
      ref={panelRef}
      id="filter-panel-portal"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className={`origin-top-right bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 select-none
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
    </div>,
    document.body,
  );
}
