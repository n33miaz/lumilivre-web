import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  coverCacheKey,
  getCoverBustVersion,
  getResolvedCover,
  setResolvedCover,
  withCoverVersion,
} from '../../utils/coverCache';

interface BookCoverProps {
  title: string;
  /** Identidade do livro: garante que o mesmo item resolva igual em toda tela. */
  bookId?: string;
  coverUrl?: string;
  isbn?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Book cover with a graceful fallback chain: stored coverUrl → OpenLibrary by
 * ISBN → the purple `.book-cover` gradient. OpenLibrary is the same provider the
 * backend already uses for ISBN metadata.
 *
 * A resolução vencedora é memorizada globalmente por identidade do livro (ver
 * {@link coverCacheKey}) e persistida em sessionStorage, então o mesmo livro
 * aparece instantaneamente em lista, grid, detalhes e exemplares sem re-resolver
 * nem "piscar". Ao trocar a capa (`bustCover`), a URL ganha um `?v=` novo e a
 * imagem recarrega em todas as telas.
 */
export function BookCover({
  title,
  bookId,
  coverUrl,
  isbn,
  className = '',
  children,
}: BookCoverProps) {
  const id = bookId || undefined;
  const bustVersion = getCoverBustVersion(id);

  // Só a capa hospedada por nós (coverUrl) fica stale após upload; a URL do
  // OpenLibrary por ISBN não muda quando trocamos a capa, então não versionamos.
  const primary =
    coverUrl && bustVersion ? withCoverVersion(coverUrl, bustVersion) : coverUrl;

  const candidates = [
    primary,
    isbn
      ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(
          isbn,
        )}-M.jpg?default=false`
      : undefined,
  ].filter(Boolean) as string[];

  const cacheKey = coverCacheKey({
    bookId: id,
    isbn: isbn || undefined,
    candidatesKey: candidates.join('|'),
  });
  const cached = cacheKey ? getResolvedCover(cacheKey) : undefined;

  // Se já resolvemos este livro antes, começa direto pela URL vencedora (ou pelo
  // gradiente, se '' marcou "nenhuma funcionou"). Senão, parte do 1º candidato.
  const initialSrc =
    cached !== undefined ? cached || null : (candidates[0] ?? null);
  const [src, setSrc] = useState<string | null>(initialSrc);

  // Reseta o estado quando a identidade OU a capa alvo mudam (ex.: cache-bust
  // após upload muda `primary` via `?v=`). Sem isso, a instância montada
  // continuaria servindo a capa antiga. Navegação com a mesma capa não dispara
  // (resetKey estável), evitando qualquer re-flicker.
  const resetKey = `${cacheKey}::${primary ?? ''}`;
  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (prevResetKey.current !== resetKey) {
      prevResetKey.current = resetKey;
      setSrc(initialSrc);
    }
  }, [resetKey, initialSrc]);

  const handleError = () => {
    setSrc((current) => {
      const at = current ? candidates.indexOf(current) : -1;
      const next = candidates[at + 1] ?? null;
      // Nenhum candidato restante: memoriza "sem capa" para não tentar de novo.
      if (next === null && cacheKey) setResolvedCover(cacheKey, '');
      return next;
    });
  };

  const handleLoad = () => {
    if (cacheKey && src) setResolvedCover(cacheKey, src);
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
