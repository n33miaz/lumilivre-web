import { useState, type ReactNode } from 'react';

interface BookCoverProps {
  title: string;
  coverUrl?: string;
  isbn?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Cache de resolução de capa, vivo durante toda a sessão (módulo, não estado).
 *
 * Chave = conjunto de candidatos (coverUrl|openlibrary). Valor = URL que
 * realmente carregou, ou '' quando nenhuma funcionou (usa o gradiente). Assim,
 * depois que a capa de um livro é resolvida UMA vez, qualquer outra renderização
 * do mesmo item (lista, grid, modal, dashboard) já começa pela URL certa — sem
 * refazer a cadeia de fallback nem repetir requisições que falham. O cache do
 * navegador serve o arquivo em si; aqui guardamos apenas qual candidato venceu.
 */
const coverResolution = new Map<string, string>();

/**
 * Book cover with a graceful fallback chain: stored coverUrl → OpenLibrary by
 * ISBN → the purple `.book-cover` gradient. OpenLibrary is the same provider the
 * backend already uses for ISBN metadata. A resolução vencedora é memorizada
 * globalmente (ver {@link coverResolution}).
 */
export function BookCover({
  title,
  coverUrl,
  isbn,
  className = '',
  children,
}: BookCoverProps) {
  const candidates = [
    coverUrl,
    isbn
      ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(
          isbn,
        )}-M.jpg?default=false`
      : undefined,
  ].filter(Boolean) as string[];

  const cacheKey = candidates.join('|');
  const cached = cacheKey ? coverResolution.get(cacheKey) : undefined;

  // Se já resolvemos este livro antes, começa direto pela URL vencedora (ou pelo
  // gradiente, se '' marcou "nenhuma funcionou"). Senão, parte do 1º candidato.
  const initialSrc = cached !== undefined ? cached || null : (candidates[0] ?? null);
  const [src, setSrc] = useState<string | null>(initialSrc);

  const handleError = () => {
    setSrc((current) => {
      const at = current ? candidates.indexOf(current) : -1;
      const next = candidates[at + 1] ?? null;
      // Nenhum candidato restante: memoriza "sem capa" para não tentar de novo.
      if (next === null && cacheKey) coverResolution.set(cacheKey, '');
      return next;
    });
  };

  const handleLoad = () => {
    if (cacheKey && src) coverResolution.set(cacheKey, src);
  };

  return (
    <div className={`book-cover relative overflow-hidden ${className}`}>
      {src && (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      {children}
    </div>
  );
}
