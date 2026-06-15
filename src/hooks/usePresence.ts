import { useEffect, useState } from 'react';

/**
 * Mantém um overlay montado durante a animação de saída.
 *
 * Retorna `shouldRender` (flag de montagem) e `isClosing` (toca a animação
 * reversa). Pareie com as classes `animate-slide-down` (abertura) e
 * `animate-slide-down-out` (fechamento) — ver `index.css`. Centraliza o padrão
 * que antes vivia duplicado no `FilterPanel`, garantindo que toda sobreposição
 * (menu do usuário, filtro avançado, notificações, troca de língua) abra e
 * feche com timings idênticos.
 *
 * @param isOpen  estado de abertura controlado pelo componente pai
 * @param exitMs  duração da animação de saída (deve casar com o CSS)
 */
export function usePresence(isOpen: boolean, exitMs = 160) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }
    if (!shouldRender) return;
    setIsClosing(true);
    const timer = window.setTimeout(() => setShouldRender(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, shouldRender, exitMs]);

  return { shouldRender, isClosing };
}
