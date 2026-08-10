import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useApiHealth } from '../contexts/ApiHealthContext';
import { usePresence } from '../hooks/usePresence';
import { formatElapsed } from './apiHealthFormat';

interface ApiWakingNoticeCardProps {
  open: boolean;
  isDown: boolean;
  elapsedMs: number;
  onRetry: () => void;
}

/**
 * O estado permanente da indisponibilidade: uma ficha pequena, ancorada na
 * base, com o relógio da espera correndo.
 *
 * A posição é escolhida por eliminação. Em cima à direita mora a pilha do
 * `ToastContext`, feita de avisos que expiram — e este não expira, acompanha um
 * episódio que pode durar minutos; ser empurrado para cima por um "salvo com
 * sucesso" o faria parecer um deles. Embaixo à esquerda mora o rodapé da
 * sidebar do painel. Sobra o centro inferior, que é onde sistema operacional e
 * navegador põem aviso de estado — e o que ele encobre (a paginação da tabela)
 * está vazio de qualquer forma enquanto a API não responde.
 */
export function ApiWakingNoticeCard({
  open,
  isDown,
  elapsedMs,
  onRetry,
}: ApiWakingNoticeCardProps) {
  const { t } = useTranslation('common');
  const { shouldRender, isClosing } = usePresence(open, 200);

  if (!shouldRender) return null;

  return createPortal(
    // Duas camadas, e cada uma resolve um conflito. A âncora não pode ser a
    // própria ficha porque `.ficha` mora DEPOIS de `@tailwind utilities` na
    // folha e traz `position: relative`, que vence um `fixed` de mesma
    // especificidade sem reclamar de nada. E a animação não pode morar na
    // âncora porque os keyframes escrevem `transform`, que apagaria o
    // `-translate-x-1/2` da centralização no meio do movimento.
    <div className="fixed bottom-4 left-1/2 z-[9998] max-w-[calc(100vw-2rem)] -translate-x-1/2">
      <div
        role="status"
        // A frase que o leitor de tela anuncia é o título, e ele só muda quando
        // o estado muda. O contador ao lado é `aria-hidden`: em região viva, um
        // número que anda de segundo em segundo vira ruído contínuo.
        aria-live="polite"
        className={`ficha ficha-elevada paper-surface flex items-center gap-3 bg-paper-50 py-2.5 pl-3.5 pr-2.5 dark:bg-ink-900 ${
          isClosing ? 'animate-slide-up-out' : 'animate-slide-up'
        }`}
      >
        {isDown ? (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
          />
        ) : (
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-lumi-500/25 border-t-lumi-500 dark:border-lumi-200/25 dark:border-t-lumi-200"
          />
        )}

        <div className="min-w-0">
          <p className="truncate font-display text-[13px] font-bold leading-tight text-paper-900 dark:text-ink-100">
            {isDown ? t('apiHealth.down_title') : t('apiHealth.title')}
          </p>
          {!isDown && (
            <p
              aria-hidden="true"
              className="cota mt-0.5 text-[10px] text-paper-500 dark:text-ink-400"
            >
              {formatElapsed(elapsedMs)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="ml-1 shrink-0 rounded-[2px] px-2 py-1 text-[12px] font-bold text-lumi-600 underline decoration-lumi-500/40 underline-offset-4 transition-colors hover:text-lumi-primary hover:decoration-lumi-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-lumi-200 dark:decoration-lumi-200/40 dark:hover:text-lumi-label"
        >
          {t('apiHealth.retry_now')}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Aparece antes do modal (a carência dele é bem mais curta) e volta a ser a
 * única coisa na tela quando o modal é fechado — por isso `!modalVisible`: os
 * dois juntos seriam a mesma informação duas vezes, uma delas embaçada atrás do
 * fundo do overlay.
 */
export function ApiWakingNotice() {
  const { status, elapsedMs, noticeVisible, modalVisible, retryNow } =
    useApiHealth();

  return (
    <ApiWakingNoticeCard
      open={noticeVisible && !modalVisible}
      isDown={status === 'down'}
      elapsedMs={elapsedMs}
      onRetry={retryNow}
    />
  );
}
