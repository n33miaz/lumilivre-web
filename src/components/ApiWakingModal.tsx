import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useApiHealth } from '../contexts/ApiHealthContext';
import { LoadingIcon } from './ui/LoadingIcon';

export function ApiWakingModal() {
  const { status, retryNow } = useApiHealth();
  const { t } = useTranslation('common');
  const [seconds, setSeconds] = useState(0);

  const visible = status !== 'up';
  const isDown = status === 'down';

  // Ticker local de 1s só para exibir o tempo decorrido de forma suave.
  useEffect(() => {
    if (!visible) {
      setSeconds(0);
      return;
    }
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={t(isDown ? 'apiHealth.down_title' : 'apiHealth.title')}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/10 shadow-glow p-7 text-center animate-grow-in">
        {!isDown && (
          <div className="flex justify-center mb-4">
            <LoadingIcon />
          </div>
        )}
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
          {t(isDown ? 'apiHealth.down_title' : 'apiHealth.title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
          {t(isDown ? 'apiHealth.down_message' : 'apiHealth.waking_message')}
        </p>
        {!isDown && (
          <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-3">
            {t('apiHealth.elapsed', { seconds })}
          </p>
        )}
        <button
          type="button"
          onClick={retryNow}
          className="mt-5 w-full h-11 rounded-xl bg-lumi-primary hover:bg-lumi-primary/90 text-white text-sm font-bold shadow-sm"
        >
          {t('apiHealth.retry_now')}
        </button>
      </div>
    </div>,
    document.body,
  );
}
