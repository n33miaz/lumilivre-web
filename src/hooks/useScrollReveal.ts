import { useLayoutEffect, type RefObject } from 'react';

/**
 * Revelação no scroll com UM observador para a página inteira.
 *
 * Cada elemento marcado com `data-reveal` sobe e aparece quando entra na
 * viewport. O estado escondido inicial vive no CSS sob `[data-reveal-ready]` —
 * atributo que só este hook escreve. Assim, se o JS não rodar ou o navegador
 * não tiver `IntersectionObserver`, nenhum bloco fica invisível.
 *
 * Um observador só (em vez de um por card) porque a landing tem dezenas de
 * alvos: cada `IntersectionObserver` extra é trabalho por frame de rolagem.
 * Só `opacity`/`transform` são animados, nunca propriedade de layout, para a
 * rolagem não pagar reflow. Com `prefers-reduced-motion` tudo já nasce visível.
 */
export function useScrollReveal(rootRef: RefObject<HTMLElement | null>) {
  // Layout effect (e não `useEffect`) porque o atributo esconde os alvos: rodar
  // depois da pintura mostraria o conteúdo já posicionado e só então o
  // apagaria — um piscar visível no primeiro carregamento.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>('[data-reveal]'),
    );
    if (targets.length === 0) return;

    const revealAll = () => {
      for (const el of targets) el.setAttribute('data-revealed', '');
    };

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      revealAll();
      return;
    }

    root.setAttribute('data-reveal-ready', '');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-revealed', '');
          // Revelar é definitivo: sem `unobserve` o mesmo bloco voltaria a ser
          // avaliado a cada rolagem, de graça.
          observer.unobserve(entry.target);
        }
      },
      // -10% embaixo para o bloco só acender depois de entrar de verdade na
      // tela; o threshold mínimo cobre seções mais altas que a viewport, que
      // nunca alcançariam uma fração maior.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
    );

    for (const el of targets) observer.observe(el);

    return () => {
      observer.disconnect();
      root.removeAttribute('data-reveal-ready');
    };
  }, [rootRef]);
}
