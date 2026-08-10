// `?picture` = WebP + PNG de fallback gerados no build (ver vite.config.ts).
//
// Centralizado num módulo só porque o hero e a vitrine mostram a MESMA captura
// do dashboard: um import compartilhado garante um asset único no bundle, em vez
// de dois caminhos equivalentes que o Vite trataria como entradas separadas.
//
// A pasta `prints/` guarda **apenas** o que este arquivo importa — quem procurar
// um print órfão só precisa comparar `ls` com esta lista. Captura que serve a
// README e não à landing mora em `docs/screenshots/`, fora do grafo do Vite.
//
// Cada tela tem par claro/escuro **com o mesmo enquadramento**: a vitrine faz
// cross-fade entre os dois e qualquer diferença de altura ou de linha visível
// vira um salto na transição. Para o painel isso quer dizer 1440x900 (16/10, a
// mesma proporção da área útil da moldura de navegador).
import dashboardLight from '../../assets/images/prints/dashboard.png?picture';
import dashboardDark from '../../assets/images/prints/dashboard_dark.png?picture';
import booksLight from '../../assets/images/prints/books.png?picture';
import booksDark from '../../assets/images/prints/books_dark.png?picture';
import loansLight from '../../assets/images/prints/loans.png?picture';
import loansDark from '../../assets/images/prints/loans_dark.png?picture';
import interestLight from '../../assets/images/prints/interest.png?picture';
import interestDark from '../../assets/images/prints/interest_dark.png?picture';
import rankingLight from '../../assets/images/prints/ranking.png?picture';
import rankingDark from '../../assets/images/prints/ranking_dark.png?picture';

/** Par de arquivos de uma mesma tela — um por tema. */
interface PrintSources {
  light: ImagetoolsPicture;
  dark: ImagetoolsPicture;
}

/**
 * Captura do painel: paisagem, exibida dentro da moldura de navegador.
 * `path` é a rota real da tela (ver `App.tsx`) — nunca um domínio inventado.
 */
export interface WebPrint extends PrintSources {
  kind: 'web';
  path: string;
}

/**
 * Captura do aplicativo Flutter: RETRATO, exibida dentro da moldura de celular.
 * Não tem `path` de propósito — celular não tem barra de endereço, e inventar
 * uma seria a única informação falsa da página.
 *
 * Ainda não existe nenhum arquivo deste tipo; o tipo entra antes das imagens
 * para que a vitrine já saiba desenhar as duas proporções lado a lado. Quando os
 * prints do app existirem, basta importá-los aqui e acrescentar uma entrada com
 * `kind: 'app'` — o carrossel não muda de altura, porque o palco é uma caixa
 * fixa e o retrato é encaixado pela ALTURA, centralizado (ver
 * `ScreensShowcase.tsx`). O par claro/escuro continua obrigatório.
 */
export interface AppPrint extends PrintSources {
  kind: 'app';
}

export type ScreenPrint = WebPrint | AppPrint;

/**
 * `satisfies` (e não uma anotação de tipo) para cada entrada conservar o tipo
 * literal: é o que faz `PRINTS.dashboard.path` continuar sendo `string` para o
 * hero, em vez de `string | undefined` vindo da união.
 *
 * A ORDEM das chaves é a ordem do carrossel, e ela conta uma história: o estado
 * da biblioteca, o que ela tem, o que está circulando, o que falta comprar e o
 * efeito nos alunos. Prints do app entram no fim, depois do painel.
 */
export const PRINTS = {
  dashboard: {
    kind: 'web',
    light: dashboardLight,
    dark: dashboardDark,
    path: '/admin/dashboard',
  },
  books: {
    kind: 'web',
    light: booksLight,
    dark: booksDark,
    path: '/admin/books',
  },
  loans: {
    kind: 'web',
    light: loansLight,
    dark: loansDark,
    path: '/admin/loans',
  },
  // A fila de compra é um painel de `/admin/books`, não uma rota própria: a
  // barra de endereço mostra a rota que o clique realmente leva.
  interest: {
    kind: 'web',
    light: interestLight,
    dark: interestDark,
    path: '/admin/books',
  },
  ranking: {
    kind: 'web',
    light: rankingLight,
    dark: rankingDark,
    path: '/admin/ranking',
  },
} satisfies Record<string, ScreenPrint>;

export type PrintKey = keyof typeof PRINTS;

/**
 * Ordem de exibição da vitrine. Vive aqui, e não no componente, porque quem
 * acrescenta um print já está neste arquivo — deixar a ordem do outro lado é o
 * jeito garantido de esquecer dela.
 */
export const PRINT_ORDER = [
  'dashboard',
  'books',
  'loans',
  'interest',
  'ranking',
] as const satisfies readonly PrintKey[];
