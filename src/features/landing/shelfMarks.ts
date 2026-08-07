/**
 * Cotas (números de classificação) das seções da página.
 *
 * São números **reais** da Classificação Decimal de Dewey, e cada um foi
 * escolhido pelo assunto da seção que marca — não são enfeite numerado. Uma
 * bibliotecária reconhece `027.8` de imediato; quem não é da área lê como um
 * sistema de ordenação, que é exatamente o efeito procurado: substituem o
 * `01 / 02 / 03` que qualquer template gera.
 *
 * Uma cota é uma etiqueta de lombada, não uma afirmação sobre o produto: ela
 * diz de que assunto a seção trata, como diria numa estante.
 */
export const SHELF_MARKS = {
  /** 027.8 — Bibliotecas escolares. */
  hero: '027.8',
  /** 025.1 — Administração de bibliotecas. */
  problem: '025.1',
  /** 025.04 — Sistemas de armazenamento e recuperação da informação. */
  ecosystem: '025.04',
  /** 025.3 — Catalogação e controle bibliográfico. */
  features: '025.3',
  /** 025.6 — Serviços de circulação (empréstimo e devolução). */
  screens: '025.6',
  /** 005.1 — Programação de computadores. */
  engineering: '005.1',
  /** 021.7 — Divulgação de bibliotecas e serviços de informação. */
  contact: '021.7',
} as const;
