import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react';

import { useDynamicPageSize } from './useDynamicPageSize';

/** `'auto'` = segue o auto-fit; número = escolha explícita do usuário. */
export type PageSizeChoice = 'auto' | number;

/** Opções fixas oferecidas no rodapé, na ordem em que aparecem. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

interface UseTablePageSizeOptions {
  /** Altura média da linha, para o auto-fit. */
  rowHeight?: number;
  /** Altura do `thead` sticky. */
  headerHeight?: number;
  /** Altura do rodapé de paginação. */
  footerHeight?: number;
  /** Piso de linhas do auto-fit. */
  minRows?: number;
  /** Remede quando muda (container que só existe depois de trocar de aba). */
  observeKey?: string | number;
  /** Usado enquanto o auto-fit ainda não mediu o container. */
  fallback?: number;
}

const storageKeyFor = (tableId: string) => `lumilivre.table.${tableId}.pageSize`;

const isFixedOption = (value: number) =>
  PAGE_SIZE_OPTIONS.includes(value as (typeof PAGE_SIZE_OPTIONS)[number]);

const readStored = (tableId: string): PageSizeChoice => {
  if (typeof window === 'undefined') return 'auto';
  const raw = window.localStorage.getItem(storageKeyFor(tableId));
  if (!raw || raw === 'auto') return 'auto';
  const parsed = Number(raw);
  return isFixedOption(parsed) ? parsed : 'auto';
};

/**
 * Só a preferência persistida de linhas por página. Use direto quando o "auto"
 * da tela não vem do `useDynamicPageSize` — é o caso da grade de capas em
 * Livros, cujo cálculo é bidimensional (colunas × linhas).
 */
export function usePageSizeChoice(tableId: string) {
  const [choice, setChoice] = useState<PageSizeChoice>(() => readStored(tableId));

  useEffect(() => {
    setChoice(readStored(tableId));
  }, [tableId]);

  const setPageSize = useCallback(
    (next: PageSizeChoice) => {
      setChoice(next);
      window.localStorage.setItem(storageKeyFor(tableId), String(next));
    },
    [tableId],
  );

  return { pageSizeChoice: choice, setPageSize };
}

/**
 * Reconcilia o auto-fit (`useDynamicPageSize`) com a escolha manual de linhas
 * por página, persistindo a preferência por tabela.
 *
 * Por que existe: o auto-fit sozinho não deixava o usuário decidir, e a escolha
 * manual sozinha volta a deixar a tabela curta (ou com scroll) ao trocar de
 * resolução. Aqui o default é `'auto'` — preenche a tela — e, quando o usuário
 * escolhe um número, o auto-fit passa a ser ignorado até ele voltar para `'auto'`.
 *
 * A chave de `localStorage` é por tabela porque cada tela tem densidade diferente:
 * uma preferência global daria página curta em uma e página com scroll em outra.
 */
export function useTablePageSize(
  tableId: string,
  containerRef: RefObject<HTMLElement | null>,
  {
    rowHeight,
    headerHeight,
    footerHeight,
    minRows,
    observeKey,
    fallback = 10,
  }: UseTablePageSizeOptions = {},
) {
  const dynamicOptions = useMemo(
    () => ({ rowHeight, headerHeight, footerHeight, minRows, observeKey }),
    [rowHeight, headerHeight, footerHeight, minRows, observeKey],
  );

  const autoPageSize = useDynamicPageSize(containerRef, dynamicOptions);
  const { pageSizeChoice, setPageSize } = usePageSizeChoice(tableId);

  // Enquanto o auto-fit não mediu (primeiro frame, container ainda sem altura),
  // cai no fallback para não disparar a query paginada com `size=0`.
  const itemsPerPage =
    pageSizeChoice === 'auto' ? autoPageSize || fallback : pageSizeChoice;

  return { pageSizeChoice, itemsPerPage, setPageSize };
}
