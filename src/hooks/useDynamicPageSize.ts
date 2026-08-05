import { useState, useEffect, type RefObject } from 'react';

interface DynamicPageSizeOptions {
  rowHeight?: number;
  headerHeight?: number;
  footerHeight?: number;
  minRows?: number;
  /**
   * Força uma nova medição quando muda. Necessário quando o container só passa a
   * existir depois de uma troca de aba: `ref.current` mudar não re-executa
   * effect, então sem esta chave a tabela da aba escondida nunca era medida e
   * ficava no fallback.
   */
  observeKey?: string | number;
}

/**
 * Calcula quantas linhas cabem no container da tabela, ajustando o page size ao
 * espaço disponível na viewport (preenche a tela, sem sobra nem scroll de
 * página).
 *
 * Robustez:
 * - Medições com altura implausível (menor que o necessário para uma linha) são
 *   descartadas. Era o que travava o valor ao alternar muito entre telas: o
 *   container chegava a ser medido com altura intermediária durante a montagem.
 * - O `ResizeObserver` observa o *content box*, então a transição de rota
 *   (translateY/opacity via Framer Motion) não dispara recálculo — só mudanças
 *   reais de tamanho (resize de janela, novo layout).
 * - O container precisa ter altura *determinada* (estar dentro de uma coluna
 *   flex limitada: flex-1 + min-h-0); caso contrário a tabela cresceria com as
 *   linhas e realimentaria a medição.
 */
export function useDynamicPageSize(
  containerRef: RefObject<HTMLElement | null>,
  options: DynamicPageSizeOptions = {},
) {
  const {
    rowHeight = 53,
    headerHeight = 48,
    footerHeight = 56,
    minRows = 5,
    observeKey,
  } = options;

  const [itemsPerPage, setItemsPerPage] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;

    const apply = () => {
      // Usa getBoundingClientRect (sub-pixel) e só aceita a medição quando o
      // container já está visível e com altura plausível. Alturas intermediárias
      // durante a transição de rota (translateY/opacity) são ignoradas — era o
      // que travava o valor ao alternar muito entre telas.
      const containerHeight = el.getBoundingClientRect().height;
      if (containerHeight < headerHeight + footerHeight + rowHeight) return;

      const available = containerHeight - headerHeight - footerHeight;
      const rows = Math.max(minRows, Math.floor(available / rowHeight));

      setItemsPerPage((prev) => (prev === rows ? prev : rows));
    };

    // Mede sempre no próximo frame: garante que o layout já estabilizou depois
    // do mount/troca de rota antes de decidir o page size.
    const measure = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(apply);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // Backup: alguns redimensionamentos de viewport não mudam o content-box
    // observado de imediato (ex.: barra de ferramentas do navegador).
    window.addEventListener('resize', measure);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, rowHeight, headerHeight, footerHeight, minRows, observeKey]);

  return itemsPerPage;
}
