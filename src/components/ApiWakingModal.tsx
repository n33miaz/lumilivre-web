import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useApiHealth } from '../contexts/ApiHealthContext';
import { usePresence } from '../hooks/usePresence';
import { formatElapsed } from './apiHealthFormat';

import CloseIcon from '../assets/icons/close-sm.svg?react';

/**
 * Cota do aviso de infraestrutura.
 *
 * `004.6` é, na Classificação Decimal de Dewey, "interfaceamento e
 * comunicações" — a prateleira onde mora o assunto "a máquina está subindo".
 * As telas de acesso abrem com `025.5` (serviços ao usuário); este diálogo não
 * é serviço ao usuário, é o encanamento aparecendo, e a cota diferente é o que
 * diz isso antes do título.
 */
const INFRA_MARK = '004.6';

/** Tudo que recebe foco dentro do diálogo, na ordem em que aparece no DOM. */
const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ApiWakingDialogProps {
  open: boolean;
  isDown: boolean;
  elapsedMs: number;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * A explicação inicial da indisponibilidade, em ficha de fichário.
 *
 * O desenho antigo (`rounded-2xl`, `shadow-glow`, cartão branco) vinha da
 * linguagem anterior do sistema e destoava de tudo que o usuário acabou de ver
 * na landing e no login. Aqui ele fala a mesma língua: filete grosso com cota à
 * esquerda e etiqueta à direita, papel com textura de fibra, canto de 2px e o
 * furo do bastão na base.
 *
 * Separado do componente conectado logo abaixo para poder ser montado sozinho
 * num teste, sem provider e sem axios no meio.
 */
export function ApiWakingDialog({
  open,
  isDown,
  elapsedMs,
  onClose,
  onRetry,
}: ApiWakingDialogProps) {
  const { t } = useTranslation('common');
  const { shouldRender, isClosing } = usePresence(open, 200);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  // O foco entra no diálogo e volta de onde saiu ao fechar. `shouldRender` está
  // nas dependências porque o nó só existe no render seguinte ao `open`: sem
  // ele, o `focus()` cairia num ref ainda nulo e o teclado continuaria na
  // página atrás do overlay.
  useEffect(() => {
    if (!open || !shouldRender) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    // Foco no próprio diálogo, e não no primeiro botão: assim o leitor de tela
    // anuncia título e explicação antes de oferecer uma ação — que é o motivo
    // de um alertdialog existir.
    dialogRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, shouldRender]);

  // Esc fecha e Tab circula dentro do diálogo. Na fase de captura porque o
  // overlay cobre a tela inteira: sem isso um Esc atravessaria para o modal de
  // formulário que ficou aberto por baixo.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusables || focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-paper-900/60 backdrop-blur-sm dark:bg-ink-950/70"
      />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        // Sem `aria-live`: o corpo carrega um contador que muda a cada segundo,
        // e uma região viva leria a caixa inteira sessenta vezes por minuto. O
        // `role="alertdialog"` com foco dentro já anuncia tudo uma vez.
        className={`ficha ficha-elevada ficha-furo paper-surface relative w-full max-w-md bg-paper-50 px-6 pb-14 pt-5 outline-none dark:bg-ink-900 sm:px-8 ${
          isClosing ? 'animate-shrink-out' : 'animate-grow-in'
        }`}
      >
        {/* `items-center` (e não a linha de base do `AuthCardHeader`): aqui o
            filete carrega um botão, e alinhar botão por baseline o deixa
            pendurado meio pixel acima da cota. */}
        <div className="flex items-center justify-between gap-3 border-b border-paper-300 pb-3 dark:border-white/10">
          <span
            aria-hidden="true"
            className="cota text-sm text-lumi-600 dark:text-lumi-200"
          >
            {INFRA_MARK}
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="cota truncate text-[10px] uppercase text-paper-500 dark:text-ink-400">
              {t('apiHealth.kicker')}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              title={t('close')}
              className="-mr-1.5 shrink-0 rounded-control p-1.5 text-paper-500 transition-colors hover:text-lumi-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-ink-400 dark:hover:text-lumi-label"
            >
              <CloseIcon className="h-4 w-4 fill-current" />
            </button>
          </div>
        </div>

        <h2
          id={titleId}
          className="mt-6 font-display text-[1.5rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-paper-900 dark:text-ink-100"
        >
          {isDown ? t('apiHealth.down_title') : t('apiHealth.title')}
        </h2>

        <p
          id={bodyId}
          className="mt-2.5 text-[15px] leading-relaxed text-paper-600 dark:text-ink-400"
        >
          {isDown ? t('apiHealth.down_message') : t('apiHealth.waking_message')}
        </p>

        {!isDown && (
          <p className="mt-5 flex items-center gap-3 border-t border-paper-300 pt-4 dark:border-white/10">
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-lumi-500/25 border-t-lumi-500 dark:border-lumi-200/25 dark:border-t-lumi-200"
            />
            <span className="cota text-[11px] uppercase text-paper-500 dark:text-ink-400">
              {t('apiHealth.elapsed', { time: formatElapsed(elapsedMs) })}
            </span>
          </p>
        )}

        {/* Ordem do DOM: a ação primária vem primeiro, então é a primeira parada
            do Tab. No visual de telas largas ela vai para a direita, que é onde
            o olho procura a confirmação. */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-control bg-lumi-primary px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-lumi-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 sm:flex-1"
          >
            {t('apiHealth.retry_now')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-paper-300 px-4 py-3 text-sm font-bold text-paper-600 transition-colors hover:border-paper-400 hover:text-paper-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:border-white/15 dark:text-ink-400 dark:hover:border-white/30 dark:hover:text-ink-100 sm:flex-1"
          >
            {t('apiHealth.dismiss')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * O modal só monta depois da carência do `ApiHealthContext` — a primeira falha
 * começa o ciclo de health-check calada. Fechado, ele não volta neste episódio:
 * quem fica na tela é o `ApiWakingNotice`.
 */
export function ApiWakingModal() {
  const { status, elapsedMs, modalVisible, dismissModal, retryNow } =
    useApiHealth();

  return (
    <ApiWakingDialog
      open={modalVisible}
      isDown={status === 'down'}
      elapsedMs={elapsedMs}
      onClose={dismissModal}
      onRetry={retryNow}
    />
  );
}
