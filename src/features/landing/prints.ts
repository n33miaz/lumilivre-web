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
// Cada tela tem par claro/escuro **com o mesmo enquadramento** (1440x900, a
// mesma proporção 16/10 da moldura): a vitrine faz cross-fade entre os dois e
// qualquer diferença de altura ou de linha visível vira um salto na transição.
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

export interface ScreenPrint {
  light: ImagetoolsPicture;
  dark: ImagetoolsPicture;
  /** Rota real da tela no painel — usada na moldura de navegador. */
  path: string;
}

export const PRINTS: Record<
  'dashboard' | 'books' | 'loans' | 'interest' | 'ranking',
  ScreenPrint
> = {
  dashboard: {
    light: dashboardLight,
    dark: dashboardDark,
    path: '/admin/dashboard',
  },
  books: { light: booksLight, dark: booksDark, path: '/admin/books' },
  loans: { light: loansLight, dark: loansDark, path: '/admin/loans' },
  // A fila de compra é um painel de `/admin/books`, não uma rota própria: a
  // barra de endereço mostra a rota que o clique realmente leva.
  interest: { light: interestLight, dark: interestDark, path: '/admin/books' },
  ranking: { light: rankingLight, dark: rankingDark, path: '/admin/ranking' },
};
