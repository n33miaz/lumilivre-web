import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, Inbox } from 'lucide-react';

import { getDashboardGerencialStats } from '../../services/dashboardService';
import { buscarSolicitacoesPendentes } from '../../services/loanRequestService';
import { usePresence } from '../../hooks/usePresence';

export function NotificationsBell() {
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { shouldRender, isClosing } = usePresence(isOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = useQuery({
    queryKey: ['dashboard-gerencial-stats'],
    queryFn: getDashboardGerencialStats,
    staleTime: 1000 * 60 * 5,
  });

  const pending = useQuery({
    queryKey: ['dashboard-solicitacoes'],
    queryFn: buscarSolicitacoesPendentes,
    staleTime: 1000 * 60,
    enabled: isOpen,
  });

  const overdueCount = stats.data?.emprestimosAtrasados ?? 0;
  const pendingCount = stats.data?.solicitacoesPendentes ?? 0;

  // Vermelho quando há solicitações; âmbar quando só há atrasos; nada quando zero.
  const dotColor =
    pendingCount > 0
      ? 'bg-red-500'
      : overdueCount > 0
        ? 'bg-amber-400'
        : null;

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const go = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const requests = pending.data ?? [];
  const isEmpty = overdueCount === 0 && requests.length === 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t('aria.notifications', { defaultValue: 'Notificações' })}
        className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5"
      >
        <Bell className="w-[18px] h-[18px] text-gray-600 dark:text-gray-300" />
        {dotColor && (
          <span
            aria-hidden="true"
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${dotColor} animate-pulse`}
          />
        )}
      </button>

      {shouldRender && (
        <div
          role="dialog"
          aria-label={t('notifications.title', {
            defaultValue: 'Notificações',
          })}
          className={`absolute right-0 top-full mt-2 w-80 max-h-[70vh] z-[60] rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 shadow-card overflow-hidden ${
            isClosing ? 'animate-slide-down-out' : 'animate-slide-down'
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
            <div className="font-display font-bold text-gray-900 dark:text-white">
              {t('notifications.title', { defaultValue: 'Notificações' })}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {isEmpty && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('notifications.empty', { defaultValue: 'Tudo em dia' })}
                </div>
              </div>
            )}

            {overdueCount > 0 && (
              <button
                type="button"
                onClick={() => go('/admin/loans')}
                className="row-hover w-full text-left p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                    {t('notifications.overdue', {
                      count: overdueCount,
                      defaultValue: '{{count}} empréstimo(s) em atraso',
                    })}
                  </div>
                </div>
              </button>
            )}

            {requests.slice(0, 6).map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => go('/admin/dashboard')}
                className="row-hover w-full text-left p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-700 dark:text-gray-200">
                      {t('notifications.new_request', {
                        name: req.leitorNome,
                        defaultValue: 'Nova solicitação de {{name}}',
                      })}
                    </div>
                    {req.livroNome && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {req.livroNome}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
