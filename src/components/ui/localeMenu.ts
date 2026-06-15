import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type RefObject,
} from 'react';

import { useLocale } from '../../contexts/LocaleContext';
import { LOCALES, type SupportedLocale } from '../../i18n';

type PlacementSide = 'top' | 'bottom' | 'left' | 'right';
type PlacementAlign = 'start' | 'end';
export type PlacementToken = 'auto' | `${PlacementSide}-${PlacementAlign}`;
type LegacyPlacement = 'top' | 'bottom';
type ResolvedPlacement = Exclude<PlacementToken, 'auto'>;

interface LocaleMenuSize {
  width: number;
  height: number;
}

interface UseLocaleMenuOptions {
  placement?: PlacementToken | LegacyPlacement;
  menuSize?: LocaleMenuSize;
}

interface UseLocaleMenuResult {
  open: boolean;
  setOpen: (open: boolean) => void;
  focusedIndex: number;
  locale: SupportedLocale;
  current: (typeof LOCALES)[number];
  containerRef: RefObject<HTMLDivElement | null>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  itemRefs: MutableRefObject<Array<HTMLLIElement | null>>;
  placementClassName: string;
  select: (code: SupportedLocale) => void;
  handleListKeyDown: (event: KeyboardEvent<HTMLUListElement>) => void;
}

const MENU_SIZE: LocaleMenuSize = {
  width: 156,
  height: LOCALES.length * 36 + 8,
};

const PLACEMENT_CLASSES: Record<ResolvedPlacement, string> = {
  'bottom-end': 'top-full right-0 mt-1',
  'bottom-start': 'top-full left-0 mt-1',
  'top-end': 'bottom-full right-0 mb-1',
  'top-start': 'bottom-full left-0 mb-1',
  'right-start': 'left-full top-0 ml-2',
  'right-end': 'left-full bottom-0 ml-2',
  'left-start': 'right-full top-0 mr-2',
  'left-end': 'right-full bottom-0 mr-2',
};

const normalizePlacement = (
  placement: PlacementToken | LegacyPlacement,
): PlacementToken => {
  if (placement === 'top') return 'top-end';
  if (placement === 'bottom') return 'bottom-end';
  return placement;
};

export function resolvePlacement(
  buttonEl: HTMLElement,
  menuSize: LocaleMenuSize = MENU_SIZE,
  gap = 4,
): ResolvedPlacement {
  const rect = buttonEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const fitsBelow = vh - rect.bottom >= menuSize.height + gap;
  const fitsAbove = rect.top >= menuSize.height + gap;
  const fitsRight = vw - rect.right >= menuSize.width + gap;
  const fitsLeft = rect.left >= menuSize.width + gap;

  if (fitsBelow) {
    return rect.left + menuSize.width <= vw ? 'bottom-start' : 'bottom-end';
  }

  if (fitsAbove) {
    return rect.left + menuSize.width <= vw ? 'top-start' : 'top-end';
  }

  if (fitsRight) return 'right-start';
  if (fitsLeft) return 'left-start';
  return 'bottom-end';
}

export function useLocaleMenu({
  placement = 'auto',
  menuSize = MENU_SIZE,
}: UseLocaleMenuOptions = {}): UseLocaleMenuResult {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resolvedPlacement, setResolvedPlacement] =
    useState<ResolvedPlacement>('bottom-end');

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const updatePlacement = useCallback(() => {
    const normalized = normalizePlacement(placement);
    if (normalized !== 'auto') {
      setResolvedPlacement(normalized);
      return;
    }

    if (buttonRef.current) {
      setResolvedPlacement(resolvePlacement(buttonRef.current, menuSize));
    }
  }, [menuSize, placement]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePlacement();
  }, [open, updatePlacement]);

  useEffect(() => {
    if (!open) return;

    const handleViewportChange = () => updatePlacement();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, updatePlacement]);

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

  const select = useCallback(
    (code: SupportedLocale) => {
      setLocale(code);
      setOpen(false);
      requestAnimationFrame(() => buttonRef.current?.focus());
    },
    [setLocale],
  );

  const handleListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
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

  return {
    open,
    setOpen,
    focusedIndex,
    locale,
    current,
    containerRef,
    buttonRef,
    itemRefs,
    placementClassName: PLACEMENT_CLASSES[resolvedPlacement],
    select,
    handleListKeyDown,
  };
}
