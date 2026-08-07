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
    // Raio de 12px: no sistema da página, tela é a única coisa arredondada —
    // papel (2px) e controle (6px) ficam abaixo. Uma moldura de navegador com o
    // mesmo raio do resto apagaria essa distinção.
    <div
      className={`overflow-hidden rounded-xl border border-paper-300 bg-paper-50 shadow-[0_28px_60px_-32px_rgba(26,24,20,0.55)] dark:border-white/10 dark:bg-ink-900 dark:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.9)] ${className}`}
    >
      <div
        className="flex items-center gap-1.5 border-b border-paper-200 px-4 py-3 dark:border-white/5"
        aria-hidden="true"
      >
        <span className="h-3 w-3 rounded-full bg-paper-300 dark:bg-white/15" />
        <span className="h-3 w-3 rounded-full bg-paper-300 dark:bg-white/15" />
        <span className="h-3 w-3 rounded-full bg-paper-300 dark:bg-white/15" />
        {/* paper-500 no claro (4,7:1 sobre paper-50) e ink-400 no escuro
            (7,2:1): o cinza claro que estava aqui ficava em 2,5:1 neste corpo
            de 11px. Os três pontos saíram do semáforo vermelho/âmbar/verde: eram
            a única cor da página que não pertencia a nenhum sistema. */}
        <span className="ml-3 truncate font-mono text-[11px] text-paper-500 dark:text-ink-400">
          {path}
        </span>
      </div>
      <div className="relative aspect-[16/10] bg-paper-100 dark:bg-ink-950">
        {children}
      </div>
    </div>
  );
}
