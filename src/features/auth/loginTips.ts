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
  /** Assuntos de que a dica fala. Ver `LoginTopic`. */
  topics: readonly LoginTopic[];
}

/**
 * Vocabulário de assuntos do produto — a moeda comum entre as dicas e as
 * chamadas do painel (`loginHeadlines.ts`).
 *
 * Mora aqui, e não no módulo de chamadas, porque a dependência entre os dois só
 * pode apontar num sentido: as chamadas conhecem o acervo de dicas para poder
 * filtrá-lo, o contrário nunca acontece.
 *
 * Curto de propósito. Um assunto por eixo do sistema; se cada dica ganhasse um
 * assunto só seu, nada colidiria com nada e o filtro não filtraria nada.
 */
export type LoginTopic =
  /** Catálogo, ISBN, exemplares. */
  | 'acervo'
  /** Empréstimo, reserva, devolução, atraso. */
  | 'emprestimo'
  /** Cadastro e dados de quem lê. */
  | 'leitor'
  /** Relatórios, exportação, números do dashboard. */
  | 'relatorio'
  /** Mural, comunicados, anexos. */
  | 'conteudo'
  /** Ranking, pódio, incentivo à leitura. */
  | 'engajamento'
  /** Aplicativo Android do leitor. */
  | 'app'
  /** Navegação do painel: busca, filtros, atalhos, tour. */
  | 'painel'
  /** Configuração, tema, idioma. */
  | 'ajuste';

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
  { id: 'isbn', icon: 'scan', topics: ['acervo'] },
  { id: 'queue', icon: 'queue', topics: ['emprestimo'] },
  { id: 'overdue', icon: 'clock', topics: ['emprestimo'] },
  // Liga e desliga ranking, mural e campos de turma: fala de três assuntos de
  // uma vez, e por isso sai de cena junto com qualquer um deles.
  { id: 'libraryType', icon: 'toggle', topics: ['ajuste', 'engajamento', 'conteudo'] },
  { id: 'reports', icon: 'report', topics: ['relatorio'] },
  { id: 'export', icon: 'export', topics: ['relatorio'] },
  { id: 'board', icon: 'board', topics: ['conteudo'] },
  { id: 'ranking', icon: 'trophy', topics: ['engajamento'] },
  { id: 'app', icon: 'phone', topics: ['app'] },
  { id: 'search', icon: 'keyboard', topics: ['painel'] },
  { id: 'filters', icon: 'filter', topics: ['painel'] },
  { id: 'cep', icon: 'pin', topics: ['leitor'] },
  { id: 'tour', icon: 'compass', topics: ['painel'] },
  { id: 'theme', icon: 'palette', topics: ['ajuste'] },
];

/**
 * Quantas dicas o painel mostra por acesso.
 *
 * Duas, e não três: com a chamada do painel também variando por visita, três
 * dicas somavam quatro blocos de texto disputando a mesma coluna. Duas deixam
 * respiro entre as seções e cada uma tem chance de ser lida.
 */
export const TIPS_PER_VISIT = 2;

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
 * Sorteio puramente aleatório repete demais — mesmo com 14 dicas e 2 por vez, um
 * em cada quatro acessos traria uma repetida, e o usuário lê isso como bug, não
 * como acaso. Excluir o conjunto anterior garante interseção vazia entre acessos
 * consecutivos; o filtro só é relaxado se o acervo restante não der conta.
 *
 * `pool` existe para que quem chama possa estreitar o acervo antes do sorteio —
 * é por ela que `loginHeadlines.ts` remove as dicas que falariam do mesmo
 * assunto da chamada da visita.
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
