interface ShelfMarkProps {
  /** Cota da seção — ver `shelfMarks.ts`. */
  mark: string;
  /** Assunto da seção, em caixa alta curta. */
  label: string;
  /** Seção sobre fundo escuro fixo (Engenharia, Contato). */
  tone?: 'default' | 'invert';
  className?: string;
}

/**
 * Etiqueta de lombada: filete fino, cota à esquerda, assunto à direita.
 *
 * É o marcador de seção da página inteira e substitui a pastilha arredondada de
 * "eyebrow" que havia antes — pastilha colorida com texto em caixa alta é
 * justamente o que toda página gerada usa. O filete separa o bloco como uma
 * divisória de gaveta de fichário faria.
 *
 * O peso caiu de 2px em tinta cheia para 1px de baixo contraste: aparecendo na
 * abertura de TODA seção, o filete grosso somava réguas demais e a página lia
 * como grade — o dono pediu menos linha horizontal. Fino, ele continua marcando
 * a seção sem pesar; é o único separador de cada abertura, e o resto do ritmo
 * agora vem do respiro.
 *
 * A cota e o assunto ficam na MESMA linha de base: alinhar pela base é o que dá
 * o ar de composição impressa. `items-baseline` continua valendo em devanágari
 * e em mandarim, onde as alturas de caixa são diferentes.
 */
export function ShelfMark({
  mark,
  label,
  tone = 'default',
  className = '',
}: ShelfMarkProps) {
  const invert = tone === 'invert';
  return (
    <div
      data-reveal
      className={`flex items-baseline gap-x-4 border-t pt-3 ${
        invert ? 'border-white/20' : 'border-paper-300 dark:border-white/10'
      } ${className}`}
    >
      {/* A cota é sinal visual: fora da tela ela viraria "zero dois sete ponto
          oito" antes de cada título, e quem ouve a página não ganha nada com
          isso. O assunto ao lado continua sendo anunciado. */}
      <span
        aria-hidden="true"
        className={`cota text-[13px] ${
          invert ? 'text-lumi-200' : 'text-lumi-600 dark:text-lumi-200'
        }`}
      >
        {mark}
      </span>
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
