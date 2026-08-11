interface ShelfMarkProps {
  /** Assunto da seção, em caixa alta curta. */
  label: string;
  /** Seção sobre fundo escuro fixo (Engenharia, Contato). */
  tone?: 'default' | 'invert';
  className?: string;
}

/**
 * Etiqueta de lombada: filete fino e o assunto da seção em caixa alta.
 *
 * É o marcador de seção da página inteira e substitui a pastilha arredondada de
 * "eyebrow" que havia antes — pastilha colorida com texto em caixa alta é
 * justamente o que toda página gerada usa. O filete separa o bloco como uma
 * divisória de gaveta de fichário faria.
 *
 * A cota (o número de classificação em mono) que abria esta etiqueta saiu a
 * pedido do dono: os códigos de Dewey liam como número misterioso para quem não
 * é da área, e o rótulo do assunto já identifica a seção sozinho.
 */
export function ShelfMark({ label, tone = 'default', className = '' }: ShelfMarkProps) {
  const invert = tone === 'invert';
  return (
    <div
      data-reveal
      className={`border-t pt-3 ${
        invert ? 'border-white/20' : 'border-paper-300 dark:border-white/10'
      } ${className}`}
    >
      <span
        className={`text-[11px] font-bold uppercase leading-tight tracking-[0.18em] ${
          invert ? 'text-ink-400' : 'text-paper-500 dark:text-ink-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
