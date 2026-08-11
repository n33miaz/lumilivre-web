import type { ReactNode } from 'react';

interface BrowserFrameProps {
  /** Rota real da tela no painel. Nunca um domínio inventado. */
  path: string;
  children: ReactNode;
  className?: string;
  /**
   * Ocupa a altura toda do pai em vez de derivá-la da própria proporção.
   *
   * Existe por causa do carrossel: lá o palco tem altura fixa (senão a página
   * saltaria a cada troca automática, ainda mais quando entrarem os prints de
   * app, que são retrato). Com `fill`, a barra de endereço fica com a altura
   * natural dela e a área do print consome o resto — que, num palco medido pela
   * própria moldura, dá exatamente os mesmos 16/10 do modo normal.
   */
  fill?: boolean;
}

/**
 * Moldura de navegador em volta de um print. A barra de endereço mostra a ROTA
 * de verdade (`/admin/...`, ver `App.tsx`) em vez de um domínio fictício: é a
 * mesma informação decorativa, só que verificável.
 *
 * Fora do modo `fill`, a área do print tem proporção fixa, então a imagem nunca
 * empurra o conteúdo de baixo enquanto carrega.
 */
export function BrowserFrame({
  path,
  children,
  className = '',
  fill = false,
}: BrowserFrameProps) {
  return (
    // Degrau "frame" da escala: no sistema da página, a tela é a coisa mais
    // arredondada — cartão e controle ficam abaixo. Uma moldura de navegador com
    // o mesmo raio do resto apagaria essa distinção.
    <div
      className={`overflow-hidden rounded-frame border border-paper-300 bg-paper-50 shadow-[0_28px_60px_-32px_rgba(26,24,20,0.55)] dark:border-white/10 dark:bg-ink-900 dark:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.9)] ${
        fill ? 'flex h-full flex-col' : ''
      } ${className}`}
    >
      <div
        className="flex shrink-0 items-center gap-1.5 border-b border-paper-200 px-4 py-3 dark:border-white/5"
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
      <div
        className={`relative bg-paper-100 dark:bg-ink-950 ${
          fill ? 'flex-1' : 'aspect-[16/10]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
