/**
 * Cache de resolução de capa compartilhado por toda a aplicação.
 *
 * Depois que a capa de um livro é resolvida UMA vez, qualquer outra
 * renderização do mesmo item (lista, grid, detalhes, exemplares) já começa pela
 * URL certa — sem refazer a cadeia de fallback nem repetir requisições que
 * falham. O cache do navegador serve o arquivo em si; aqui guardamos apenas qual
 * candidato venceu, chaveado pela IDENTIDADE do livro (não pela lista de URLs),
 * para que o mesmo livro resolva igual em qualquer tela.
 *
 * Persistência em `sessionStorage` faz o resultado sobreviver a navegações
 * dentro da mesma sessão (troca de rota, voltar/avançar) sem re-resolver.
 */

const RESOLVED_KEY = 'lumi.coverResolution';
const BUST_KEY = 'lumi.coverBust';

type ResolvedMap = Record<string, string>;
type BustMap = Record<string, number>;

// Espelho em memória do sessionStorage: leitura síncrona e barata durante o
// render, gravação preguiçosa de volta ao storage.
let resolvedMem: ResolvedMap | null = null;
let bustMem: BustMap | null = null;

function loadResolved(): ResolvedMap {
  if (resolvedMem) return resolvedMem;
  try {
    const raw = sessionStorage.getItem(RESOLVED_KEY);
    resolvedMem = raw ? (JSON.parse(raw) as ResolvedMap) : {};
  } catch {
    resolvedMem = {};
  }
  return resolvedMem;
}

function loadBust(): BustMap {
  if (bustMem) return bustMem;
  try {
    const raw = sessionStorage.getItem(BUST_KEY);
    bustMem = raw ? (JSON.parse(raw) as BustMap) : {};
  } catch {
    bustMem = {};
  }
  return bustMem;
}

function persist(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage indisponível/cheio: o cache continua válido em memória.
  }
}

/**
 * Chave de identidade do livro para o cache. Preferimos `bookId`, caímos para
 * `isbn` e, por fim, para a própria lista de candidatos (quando não há id/isbn,
 * ex.: capas avulsas). Assim o mesmo livro resolve igual em qualquer tela.
 */
export function coverCacheKey(opts: {
  bookId?: string;
  isbn?: string;
  candidatesKey: string;
}): string {
  if (opts.bookId) return `id:${opts.bookId}`;
  if (opts.isbn) return `isbn:${opts.isbn}`;
  return `url:${opts.candidatesKey}`;
}

/** URL vencedora memorizada, `''` para "sem capa", ou `undefined` se não resolvido. */
export function getResolvedCover(key: string): string | undefined {
  return loadResolved()[key];
}

export function setResolvedCover(key: string, url: string): void {
  const cache = loadResolved();
  if (cache[key] === url) return;
  cache[key] = url;
  persist(RESOLVED_KEY, cache);
}

/**
 * Versão de cache-busting do livro (ou `undefined`). Estável entre navegações
 * até a próxima troca de capa, para que o navegador consiga cachear a capa NOVA.
 */
export function getCoverBustVersion(bookId?: string): number | undefined {
  if (!bookId) return undefined;
  return loadBust()[bookId];
}

/**
 * Invalida a capa de um livro após upload de uma nova capa: descarta a
 * resolução memorizada e bumpa a versão para forçar `?v=` novo (o browser serve
 * a imagem antiga se a URL não mudar).
 */
export function bustCover(bookId: string | number): void {
  const id = String(bookId);
  if (!id) return;

  const bust = loadBust();
  bust[id] = Date.now();
  persist(BUST_KEY, bust);

  const resolved = loadResolved();
  const key = `id:${id}`;
  if (key in resolved) {
    delete resolved[key];
    persist(RESOLVED_KEY, resolved);
  }
}

/** Acrescenta `?v=`/`&v=` à URL para furar o cache do navegador. */
export function withCoverVersion(url: string, version: number): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${version}`;
}
