import type { ReactNode } from 'react';

interface BrowserFrameProps {
  /** Rota real da tela no painel. Nunca um domínio inventado. */
  path: string;
  children: ReactNode;
  className?: string;
}

/**
 * Moldura de navegador em volta de um print. A barra de endereço mostra a ROTA
 * de verdade (`/admin/...`, ver `App.tsx`) em vez de um domínio fictício: é a
 * mesma informação decorativa, só que verificável.
 *
 * A área do print tem proporção fixa, então a imagem nunca empurra o conteúdo
 * de baixo enquanto carrega.
 */
export function BrowserFrame({
  path,
  children,
  className = '',
}: BrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-ink-900 ${className}`}
    >
      <div
        className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-3 dark:border-white/5"
        aria-hidden="true"
      >
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        {/* gray-500 no claro (4,8:1) e gray-400 no escuro (7,6:1): o gray-400
            sobre branco ficava em 2,5:1 neste corpo de 11px. */}
        <span className="ml-3 truncate font-mono text-[11px] text-gray-500 dark:text-gray-400">
          {path}
        </span>
      </div>
      <div className="relative aspect-[16/10] bg-gray-50 dark:bg-ink-950">
        {children}
      </div>
    </div>
  );
}
