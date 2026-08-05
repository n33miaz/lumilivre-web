/**
 * Acervo de dicas do painel esquerdo do login.
 *
 * Cada entrada é uma dica de uso de verdade ("o CEP preenche o endereço"), não
 * elogio ao produto: quem chega nesta tela é a pessoa que vai operar o sistema,
 * e uma dica por acesso ensina mais do que um adjetivo.
 *
 * O `id` aponta para o namespace `auth` (`login.tip.<id>.title` e `.desc`) e o
 * `icon` é resolvido no componente — este módulo fica sem dependência de React
 * para poder ser testado sozinho.
 */
export interface LoginTip {
  id: string;
  icon: LoginTipIcon;
}

export type LoginTipIcon =
  | 'scan'
  | 'queue'
  | 'clock'
  | 'toggle'
  | 'report'
  | 'export'
  | 'board'
  | 'trophy'
  | 'phone'
  | 'keyboard'
  | 'filter'
  | 'pin'
  | 'compass'
  | 'palette';

export const LOGIN_TIPS: readonly LoginTip[] = [
  { id: 'isbn', icon: 'scan' },
  { id: 'queue', icon: 'queue' },
  { id: 'overdue', icon: 'clock' },
  { id: 'libraryType', icon: 'toggle' },
  { id: 'reports', icon: 'report' },
  { id: 'export', icon: 'export' },
  { id: 'board', icon: 'board' },
  { id: 'ranking', icon: 'trophy' },
  { id: 'app', icon: 'phone' },
  { id: 'search', icon: 'keyboard' },
  { id: 'filters', icon: 'filter' },
  { id: 'cep', icon: 'pin' },
  { id: 'tour', icon: 'compass' },
  { id: 'theme', icon: 'palette' },
];

/** Quantas dicas o painel mostra por acesso. */
export const TIPS_PER_VISIT = 3;

/**
 * Chave própria no `localStorage`. Não pode viajar dentro de `user`/`authToken`,
 * que o `AuthContext` apaga no logout: a lembrança do último conjunto precisa
 * justamente sobreviver ao logout, senão a próxima entrada repete.
 */
export const LOGIN_TIPS_STORAGE_KEY = 'lumilivre.loginTips.lastShown';

function resolveStorage(storage?: Storage): Storage | undefined {
  if (storage) return storage;
  return typeof window !== 'undefined' ? window.localStorage : undefined;
}

/** Ids mostrados no acesso anterior. Lista vazia quando não há histórico. */
export function readLastShownTips(storage?: Storage): string[] {
  const store = resolveStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(LOGIN_TIPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    // Modo privado, cota cheia ou valor corrompido: sem histórico é sempre
    // melhor que uma tela de login quebrada.
    return [];
  }
}

/** Guarda o conjunto atual para que o próximo acesso o exclua. */
export function rememberLoginTips(
  tips: readonly LoginTip[],
  storage?: Storage,
): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.setItem(
      LOGIN_TIPS_STORAGE_KEY,
      JSON.stringify(tips.map((tip) => tip.id)),
    );
  } catch {
    // Storage indisponível: a rotação segue funcionando dentro da sessão.
  }
}

/** Fisher-Yates sobre uma cópia — o acervo exportado é somente leitura. */
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Escolhe as dicas do acesso atual, **sem nenhuma das que estão em `exclude`**.
 *
 * Sorteio puramente aleatório repete demais — com 14 dicas e 3 por vez, mais de
 * um em cada cinco acessos traria uma repetida, e o usuário lê isso como bug, não
 * como acaso. Excluir o conjunto anterior garante interseção vazia entre acessos
 * consecutivos; o filtro só é relaxado se o acervo restante não der conta.
 *
 * Função pura de propósito (nada de storage aqui): sob StrictMode o React chama
 * o inicializador de estado duas vezes, e um efeito colateral aqui consumiria
 * duas rotações por visita. Quem grava é `rememberLoginTips`, num efeito.
 */
export function selectLoginTips(
  options: {
    pool?: readonly LoginTip[];
    count?: number;
    exclude?: readonly string[];
    random?: () => number;
  } = {},
): LoginTip[] {
  const pool = options.pool ?? LOGIN_TIPS;
  const count = Math.min(options.count ?? TIPS_PER_VISIT, pool.length);
  const exclude = options.exclude ?? [];
  const random = options.random ?? Math.random;

  const fresh = pool.filter((tip) => !exclude.includes(tip.id));
  const candidates =
    fresh.length >= count
      ? shuffled(fresh, random)
      : [
          ...shuffled(fresh, random),
          // Acervo curto demais: completa com as repetidas, sempre depois das
          // inéditas, para minimizar a repetição em vez de desistir dela.
          ...shuffled(
            pool.filter((tip) => exclude.includes(tip.id)),
            random,
          ),
        ];

  return candidates.slice(0, count);
}
