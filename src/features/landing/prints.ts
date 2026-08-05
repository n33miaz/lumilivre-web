// `?picture` = WebP + PNG de fallback gerados no build (ver vite.config.ts).
//
// Centralizado num módulo só porque o hero e a vitrine mostram a MESMA captura
// do dashboard: um import compartilhado garante um asset único no bundle, em vez
// de dois caminhos equivalentes que o Vite trataria como entradas separadas.
// É também o único lugar que o T14 precisa abrir para trocar os prints.
import dashboardLight from '../../assets/images/prints/dashboard.png?picture';
import dashboardDark from '../../assets/images/prints/dashboard_dark.png?picture';
import booksLight from '../../assets/images/prints/books-new.png?picture';
import booksDark from '../../assets/images/prints/books_dark-new.png?picture';
import loansLight from '../../assets/images/prints/loans.png?picture';
import loansDark from '../../assets/images/prints/loans_dark.png?picture';
import rankingLight from '../../assets/images/prints/ranking.png?picture';
import rankingDark from '../../assets/images/prints/ranking_dark.png?picture';
import reportsLight from '../../assets/images/prints/reports.png?picture';
import reportsDark from '../../assets/images/prints/reports_dark.png?picture';

export interface ScreenPrint {
  light: ImagetoolsPicture;
  dark: ImagetoolsPicture;
  /** Rota real da tela no painel — usada na moldura de navegador. */
  path: string;
}

export const PRINTS: Record<
  'dashboard' | 'books' | 'loans' | 'ranking' | 'reports',
  ScreenPrint
> = {
  dashboard: {
    light: dashboardLight,
    dark: dashboardDark,
    path: '/admin/dashboard',
  },
  books: { light: booksLight, dark: booksDark, path: '/admin/books' },
  loans: { light: loansLight, dark: loansDark, path: '/admin/loans' },
  ranking: { light: rankingLight, dark: rankingDark, path: '/admin/ranking' },
  reports: { light: reportsLight, dark: reportsDark, path: '/admin/reports' },
};
