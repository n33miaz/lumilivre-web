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
  livroId: number;
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
    const response = await api.get<DashboardGerencialStats>('/dashboard/stats');
    return response.data;
  };

export const getTopLivrosDashboard = async (): Promise<TopLivroDashboard[]> => {
  const response = await api.get<TopLivroDashboard[]>('/dashboard/top-livros');
  return response.data || [];
};

export const getEmprestimosPorMesDashboard = async (): Promise<
  EmprestimosPorMesDashboard[]
> => {
  const response = await api.get<EmprestimosPorMesDashboard[]>(
    '/dashboard/emprestimos-por-mes',
  );
  return response.data || [];
};
