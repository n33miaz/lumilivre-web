/**
 * Acervo de chamadas do painel esquerdo do login — o par de linhas grandes
 * ("Sua biblioteca inteira em um só ecossistema") e o texto de apoio abaixo.
 *
 * Eram fixos. Agora giram por visita, como as dicas já giravam, e é aí que mora
 * o problema que este módulo existe para resolver: **chamada e dica não podem
 * falar do mesmo assunto na mesma tela.** Uma chamada sobre catalogação ao lado
 * da dica "Cadastre pelo ISBN" faz a tela parecer repetir a si mesma — e isso
 * lê como descuido, não como coincidência.
 *
 * A garantia é estrutural, não estatística: cada chamada declara os assuntos que
 * cobre (`LoginTopic`, o mesmo vocabulário das dicas), e o sorteio acontece em
 * duas etapas — primeiro a chamada, depois as dicas **dentro do acervo que
 * sobra** quando os assuntos dela são retirados. Nenhuma tela pode se repetir,
 * qualquer que seja o sorteio; não há caminho no código que produza a colisão.
 *
 * Sem React de propósito, como o `loginTips.ts`: o componente só resolve textos
 * e ícones, e a regra de composição pode ser testada sozinha.
 */
import {
  LOGIN_TIPS,
  rememberLoginTips,
  selectLoginTips,
  TIPS_PER_VISIT,
  type LoginTip,
  type LoginTopic,
} from './loginTips';

export interface LoginHeadline {
  /**
   * Aponta para três chaves do namespace `auth`: `login.headline.<id>.start`,
   * `.highlight` e `.subtitle`.
   */
  id: string;
  /**
   * Assuntos de que esta chamada fala. Toda dica que compartilhe pelo menos um
   * deles fica fora do sorteio da visita.
   *
   * Lista curta é regra, não descuido: quanto mais assuntos uma chamada reclama,
   * menos dicas restam para acompanhá-la. Vazio é legítimo — a chamada sobre
   * engenharia não fala de nenhuma função do sistema e combina com tudo.
   */
  topics: readonly LoginTopic[];
}

export const LOGIN_HEADLINES: readonly LoginHeadline[] = [
  { id: 'ecosystem', topics: ['app'] },
  { id: 'catalog', topics: ['acervo'] },
  { id: 'loans', topics: ['emprestimo'] },
  { id: 'reports', topics: ['relatorio'] },
  { id: 'readers', topics: ['leitor'] },
  { id: 'engagement', topics: ['engajamento', 'conteudo'] },
  { id: 'panel', topics: ['painel'] },
  { id: 'craft', topics: [] },
];

/**
 * Chave própria no `localStorage`, irmã da das dicas e pelo mesmo motivo: ela
 * precisa sobreviver ao logout, que apaga `user`/`authToken`. Se morresse junto,
 * a chamada da próxima entrada poderia repetir a que a pessoa acabou de ver.
 */
export const LOGIN_HEADLINE_STORAGE_KEY = 'lumilivre.loginHeadline.lastShown';

function resolveStorage(storage?: Storage): Storage | undefined {
  if (storage) return storage;
  return typeof window !== 'undefined' ? window.localStorage : undefined;
}

/** Id da chamada do acesso anterior, ou `null` quando não há histórico. */
export function readLastShownHeadline(storage?: Storage): string | null {
  const store = resolveStorage(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(LOGIN_HEADLINE_STORAGE_KEY);
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  } catch {
    // Modo privado ou valor corrompido: sem histórico é sempre melhor que uma
    // tela de login quebrada.
    return null;
  }
}

/** Guarda a chamada atual para que o próximo acesso a exclua. */
export function rememberLoginHeadline(
  headline: LoginHeadline,
  storage?: Storage,
): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.setItem(LOGIN_HEADLINE_STORAGE_KEY, headline.id);
  } catch {
    // Storage indisponível: a rotação segue funcionando dentro da sessão.
  }
}

/**
 * Sorteia a chamada da visita, evitando a do acesso anterior.
 *
 * Pura de propósito (nada de storage aqui): sob StrictMode o React chama o
 * inicializador de estado duas vezes, e um efeito colateral aqui consumiria duas
 * rotações por visita. Quem grava é `rememberLoginVisit`, num efeito.
 */
export function selectLoginHeadline(
  options: {
    pool?: readonly LoginHeadline[];
    exclude?: string | null;
    random?: () => number;
  } = {},
): LoginHeadline {
  const pool = options.pool ?? LOGIN_HEADLINES;
  const random = options.random ?? Math.random;

  const fresh = pool.filter((headline) => headline.id !== options.exclude);
  // Acervo de uma chamada só: repetir é a única saída, e é melhor que devolver
  // nada e deixar o painel sem título.
  const candidates = fresh.length > 0 ? fresh : pool;

  return candidates[Math.floor(random() * candidates.length) % candidates.length];
}

/**
 * Dicas que NÃO falam de nenhum assunto da chamada.
 *
 * É o coração da regra: o filtro roda antes do sorteio das dicas, então a
 * colisão não é improvável — é inalcançável.
 */
export function tipsOffTopic(
  headline: LoginHeadline,
  pool: readonly LoginTip[] = LOGIN_TIPS,
): LoginTip[] {
  return pool.filter(
    (tip) => !tip.topics.some((topic) => headline.topics.includes(topic)),
  );
}

export interface LoginVisit {
  headline: LoginHeadline;
  tips: LoginTip[];
}

/**
 * Monta a visita inteira: chamada primeiro, dicas depois, dentro do que sobra.
 *
 * A ordem é o que dá a garantia. Sortear os dois lados de forma independente e
 * conferir a colisão depois obrigaria a tentar de novo — e "tentar de novo até
 * dar certo" não é garantia, é sorte com laço em volta.
 */
export function selectLoginVisit(
  options: {
    headlines?: readonly LoginHeadline[];
    tips?: readonly LoginTip[];
    count?: number;
    excludeHeadline?: string | null;
    excludeTips?: readonly string[];
    random?: () => number;
  } = {},
): LoginVisit {
  const random = options.random ?? Math.random;

  const headline = selectLoginHeadline({
    pool: options.headlines,
    exclude: options.excludeHeadline,
    random,
  });

  return {
    headline,
    tips: selectLoginTips({
      pool: tipsOffTopic(headline, options.tips ?? LOGIN_TIPS),
      count: options.count ?? TIPS_PER_VISIT,
      exclude: options.excludeTips,
      random,
    }),
  };
}

/** Grava os dois lados da visita, para que a próxima não os repita. */
export function rememberLoginVisit(visit: LoginVisit, storage?: Storage): void {
  rememberLoginHeadline(visit.headline, storage);
  rememberLoginTips(visit.tips, storage);
}
