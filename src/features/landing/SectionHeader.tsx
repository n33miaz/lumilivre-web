interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  /**
   * `center` para seções em grade; `left` para as de leitura corrida, onde um
   * título centralizado sobre texto alinhado à esquerda quebra o eixo.
   */
  align?: 'center' | 'left';
  /** Seção sobre fundo escuro fixo (Engenharia) — inverte a escala de cinzas. */
  tone?: 'default' | 'invert';
}

// Uma escala tipográfica só para todas as seções: antes cada componente
// escolhia o seu peso/tracking e os h2 não batiam entre si.
export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = 'center',
  tone = 'default',
}: SectionHeaderProps) {
  const centered = align === 'center';
  const invert = tone === 'invert';

  return (
    <div
      className={
        centered ? 'max-w-2xl mx-auto text-center mb-14' : 'max-w-2xl mb-12'
      }
    >
      {eyebrow && (
        <span
          data-reveal
          className={`inline-block px-3 py-1 mb-4 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${
            invert
              ? 'bg-white/10 text-lumi-200'
              : 'bg-lumi-100 text-lumi-700 dark:bg-lumi-500/20 dark:text-lumi-200'
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        data-reveal
        data-reveal-delay="1"
        className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
          lead ? 'mb-4' : ''
        } ${invert ? 'text-white' : 'text-gray-900 dark:text-white'}`}
      >
        {title}
      </h2>
      {lead && (
        <p
          data-reveal
          data-reveal-delay="2"
          className={`text-lg leading-relaxed ${
            invert ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
