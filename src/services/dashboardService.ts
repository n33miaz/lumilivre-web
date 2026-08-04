import api from './api';

export interface DashboardGerencialStats {
  emprestimosAtivos: number;
  emprestimosAtrasados: number;
  emprestimosConcluidos: number;
  mediaDiasDevolucao: number;
  solicitacoesPendentes: number;
  reservasAguardando: number;
}

export interface TopLivroDashboard {
  // Identificador usado como chave de lista/render — mantido como string,
  // coerente com o mapper (`String(item.bookId)`).
  livroId: string;
  titulo: string;
  autor: string | null;
  imagem: string | null;
  totalEmprestimos: number;
  avaliacao: number;
}

export interface EmprestimosPorMesDashboard {
  mes: string;
  total: number;
}

export const getDashboardGerencialStats =
  async (): Promise<DashboardGerencialStats> => {
    const response = await api.get('/api/dashboard/stats');
    return {
      emprestimosAtivos: response.data.activeLoans,
      emprestimosAtrasados: response.data.overdueLoans,
      emprestimosConcluidos: response.data.completedLoans,
      mediaDiasDevolucao: response.data.avgReturnDays,
      solicitacoesPendentes: response.data.pendingRequests,
      reservasAguardando: response.data.waitingReservations,
    };
  };

export const getTopLivrosDashboard = async (): Promise<TopLivroDashboard[]> => {
  const response = await api.get('/api/dashboard/top-books');
  return (response.data || []).map((item: Record<string, unknown>) => ({
    livroId: String(item.bookId),
    titulo: item.title as string,
    autor: item.author as string | null,
    imagem: item.coverUrl as string | null,
    totalEmprestimos: item.totalLoans as number,
    avaliacao: item.rating as number,
  }));
};

export const getEmprestimosPorMesDashboard = async (): Promise<
  EmprestimosPorMesDashboard[]
> => {
  const response = await api.get('/api/dashboard/loans-by-month');
  return (response.data || []).map((item: Record<string, unknown>) => ({
    mes: item.month as string,
    total: item.total as number,
  }));
};
