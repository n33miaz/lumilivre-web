import {
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * Brilho da marca que segue o cursor dentro de um cartão (ver `.ficha-glow` em
 * index.css).
 *
 * É o mesmo princípio do `buttonLight` dos botões: as coordenadas do ponteiro
 * viram variáveis CSS escritas por CSSOM (`el.style.setProperty`), nunca por
 * atributo `style` — que a CSP desta imagem bloquearia. O CSS faz o resto,
 * então nenhum quadro do movimento passa pelo React.
 *
 * Os manipuladores só são devolvidos quando há ponteiro fino (mouse/trackpad) E
 * não há pedido de movimento reduzido: em toque, o brilho seguindo o dedo não
 * faz sentido, e com movimento reduzido ele não deve existir. Devolver `{}` nos
 * outros casos deixa o cartão sem listener nenhum — custo zero fora do alvo.
 */
export function usePointerGlow() {
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const enabled = finePointer && !reduced;

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      el.style.setProperty(
        '--glow-x',
        `${((event.clientX - rect.left) / rect.width) * 100}%`,
      );
      el.style.setProperty(
        '--glow-y',
        `${((event.clientY - rect.top) / rect.height) * 100}%`,
      );
    },
    [],
  );

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.currentTarget.style.setProperty('--glow-on', '1');
    },
    [],
  );

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.currentTarget.style.setProperty('--glow-on', '0');
    },
    [],
  );

  return enabled ? { onPointerMove, onPointerEnter, onPointerLeave } : {};
}
