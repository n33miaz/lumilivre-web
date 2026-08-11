import { ShelfMark } from './ShelfMark';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  lead?: string;
  /** Seção sobre fundo escuro fixo (Engenharia) — inverte a escala de tinta. */
  tone?: 'default' | 'invert';
}

/**
 * Cabeçalho de seção: etiqueta de lombada, título e linha de apoio.
 *
 * Três decisões, todas contra a mesma armadilha:
 *
 * 1. **Sempre à esquerda.** A versão anterior centralizava por padrão, e título
 *    centralizado sobre conteúdo alinhado à esquerda quebra o eixo da página —
 *    além de ser o desenho de herói que todo gerador entrega. Um eixo só, à
 *    esquerda, da primeira seção à última.
 * 2. **Escala com salto grande.** Título em `clamp` até 3,25rem contra um apoio
 *    de 1,0625rem: é o contraste de tamanho, não o peso da fonte, que faz uma
 *    página parecer editorial. `leading` em 1,14 — apertado para o latino sem
 *    esmagar as matras do devanágari, que colidem abaixo de ~1,1.
 * 3. **Medida de leitura curta.** O apoio para em 54ch. Linha longa é o que faz
 *    texto de marketing parecer preenchimento.
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  tone = 'default',
}: SectionHeaderProps) {
  const invert = tone === 'invert';

  return (
    <div className="mb-12 max-w-3xl lg:mb-16">
      <ShelfMark label={eyebrow} tone={tone} />
      <h2
        data-reveal
        data-reveal-delay="1"
        className={`mt-6 font-display text-[1.9rem] font-extrabold leading-[1.14] tracking-[-0.025em] sm:text-[2.4rem] lg:text-[3rem] ${
          lead ? 'mb-5' : ''
        } ${invert ? 'text-ink-100' : 'text-paper-900 dark:text-ink-100'}`}
      >
        {title}
      </h2>
      {lead && (
        <p
          data-reveal
          data-reveal-delay="2"
          className={`max-w-[54ch] text-[17px] leading-relaxed ${
            invert ? 'text-ink-200' : 'text-paper-600 dark:text-ink-200'
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
