/**
 * Import terminado em `?picture` passa pelo vite-imagetools e devolve as fontes
 * modernas + o arquivo de fallback (ver `vite.config.ts`). O tipo é declarado
 * aqui porque o pacote não exporta o formato de saída, e sem isto o TypeScript
 * enxergaria a importação como a `string` de um asset comum.
 */
interface ImagetoolsPicture {
  /** Chave = formato (`webp`), valor = srcset pronto para o `<source>`. */
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

declare module '*?picture' {
  const picture: ImagetoolsPicture;
  export default picture;
}
