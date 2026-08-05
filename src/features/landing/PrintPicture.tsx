import type { ScreenPrint } from './prints';

interface PrintPictureProps {
  print: ScreenPrint;
  isDark: boolean;
  /** Descrição real da tela — não o título de marketing. */
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  /**
   * Camada empilhada que está invisível. Continua no DOM pelo cross-fade, mas
   * sai da árvore de acessibilidade — senão o leitor de tela anuncia as cinco
   * telas de uma vez.
   */
  hiddenFromReaders?: boolean;
}

/**
 * Renderiza um print do painel pelo pipeline `?picture`: um `<source>` por
 * formato moderno e o `<img>` de fallback. Extraído porque o hero e a vitrine
 * precisam exatamente do mesmo markup — e porque o detalhe do `<picture>` não
 * posicionado (abaixo) é fácil de quebrar sem perceber.
 */
export function PrintPicture({
  print,
  isDark,
  alt,
  className = '',
  loading = 'lazy',
  hiddenFromReaders = false,
}: PrintPictureProps) {
  const source = isDark ? print.dark : print.light;

  return (
    // O <picture> não é posicionado, então o `absolute` do <img>
    // continua se resolvendo contra a moldura de fora — é isso que
    // permite empilhar telas e trocar entre elas com fade.
    <picture>
      {Object.entries(source.sources).map(([format, srcset]) => (
        <source key={format} srcSet={srcset} type={`image/${format}`} />
      ))}
      <img
        src={source.img.src}
        alt={alt}
        aria-hidden={hiddenFromReaders || undefined}
        loading={loading}
        decoding="async"
        width={source.img.w}
        height={source.img.h}
        className={className}
      />
    </picture>
  );
}
