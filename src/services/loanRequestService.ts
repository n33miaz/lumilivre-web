import api from './api';

export interface SolicitacaoPendente {
  id: string;
  alunoNome: string;
  alunoMatricula?: string;
  livroNome: string;
  exemplarTombo?: string;
  dataSolicitacao: string;
}

const toSolicitacaoPendente = (
  item: Record<string, unknown>,
): SolicitacaoPendente => ({
  id: String(item.id ?? ''),
  alunoNome: (item.studentName as string) ?? '',
  alunoMatricula: (item.studentRegistrationNumber as string) ?? undefined,
  livroNome: (item.bookTitle as string) ?? '',
  exemplarTombo: (item.copyCode as string) ?? undefined,
  dataSolicitacao: (item.requestedAt as string) ?? '',
});

export const buscarSolicitacoesPendentes = async (): Promise<
  SolicitacaoPendente[]
> => {
  try {
    const response = await api.get<Record<string, unknown>[]>(
      '/api/loan-requests/pending',
    );
    return (response.data || []).map(toSolicitacaoPendente);
  } catch (error) {
    console.error('Erro ao buscar solicitacoes pendentes:', error);
    return [];
  }
};

export const processarSolicitacao = async (
  id: number | string,
  aceitar: boolean,
) => {
  const response = await api.post(`/api/loan-requests/${id}/process`, null, {
    params: { accept: aceitar },
  });
  return response.data;
};
