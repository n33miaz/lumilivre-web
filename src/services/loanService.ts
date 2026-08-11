import api from './api';
import type { Page } from '../types';

const loanStatusToPt = (status?: string | null) => {
  switch (status) {
    case 'ACTIVE':
      return 'ATIVO';
    case 'OVERDUE':
      return 'ATRASADO';
    case 'COMPLETED':
      return 'CONCLUIDO';
    default:
      return 'ATIVO';
  }
};

const toOffsetDateTime = (date: string) => {
  if (!date) return '';
  if (date.includes('T')) return date;

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (isoDateMatch) {
    return `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}T12:00:00-03:00`;
  }

  const brDateMatch = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/.exec(
    date,
  );
  if (brDateMatch) {
    return `${brDateMatch[3]}-${brDateMatch[2]}-${brDateMatch[1]}T12:00:00-03:00`;
  }

  return `${date}T12:00:00-03:00`;
};

const mapLoanListItem = (item: Record<string, unknown>): EmprestimoListagemDTO => ({
  id: item.id as string,
  statusEmprestimo: loanStatusToPt(
    (item.status as { code?: string } | undefined)?.code,
  ),
  livroNome: (item.bookTitle as string) ?? '',
  livroTombo: (item.copyCode as string) ?? '',
  nomeLeitor: (item.readerName as string) ?? '',
  matriculaLeitor: (item.readerRegistrationNumber as string) ?? '',
  curso: (item.courseName as string) ?? '',
  dataEmprestimo: (item.borrowedAt as string) ?? '',
  dataDevolucao: (item.dueAt as string) ?? '',
  dataRetorno: (item.returnedAt as string) ?? '',
});

export interface EmprestimoListagemDTO {
  id: string;
  statusEmprestimo: 'ATIVO' | 'ATRASADO' | 'CONCLUIDO';
  livroNome: string;
  livroTombo: string;
  nomeLeitor: string;
  matriculaLeitor: string;
  curso: string;
  dataEmprestimo: string;
  /** Data combinada de devolução (dueAt). */
  dataDevolucao: string;
  /** Data real de devolução (returnedAt) — vazio enquanto não devolvido. */
  dataRetorno: string;
}

export interface EmprestimoAtivoDTO {
  id: string;
  livroNome: string;
  leitorNome: string;
  leitorMatricula: string;
  tombo: string;
  dataEmprestimo: string;
  dataDevolucao: string;
  statusEmprestimo: 'ATIVO' | 'ATRASADO' | 'CONCLUIDO';
}

export interface LeitorRanking {
  matricula: string;
  nome: string;
  emprestimosCount: number;
}

export interface EmprestimoFilterParams {
  statusEmprestimo?: string;
  dataEmprestimo?: string;
  dataDevolucao?: string;
  dataDevolucaoInicio?: string;
  tombo?: string;
  livroNome?: string;
  leitorNome?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface EmprestimoPayload {
  id?: string | number;
  leitor_matricula: string;
  exemplar_tombo: string;
  data_emprestimo: string;
  data_devolucao: string;
}

export const buscarEmprestimosPaginado = async (
  texto: string,
  page: number,
  size: number,
  sort: string,
): Promise<Page<EmprestimoListagemDTO>> => {
  const response = await api.get('/api/loans', {
    params: { q: texto || undefined, page, size, sort },
  });
  return {
    ...response.data,
    content: (response.data.content || []).map(mapLoanListItem),
  };
};

export const buscarEmprestimosAvancado = async (
  params: EmprestimoFilterParams,
): Promise<Page<EmprestimoListagemDTO>> => {
  const response = await api.get('/api/loans/advanced', {
    params: {
      status:
        params.statusEmprestimo === 'ATIVO'
          ? 'ACTIVE'
          : params.statusEmprestimo === 'ATRASADO'
            ? 'OVERDUE'
            : params.statusEmprestimo === 'CONCLUIDO'
              ? 'COMPLETED'
              : undefined,
      copyCode: params.tombo,
      bookTitle: params.livroNome,
      readerName: params.leitorNome,
      borrowedAt: params.dataEmprestimo,
      dueAt: params.dataDevolucao,
      dueAtStart: params.dataDevolucaoInicio,
      page: params.page,
      size: params.size,
      sort: params.sort,
    },
  });
  return {
    ...response.data,
    content: (response.data.content || []).map(mapLoanListItem),
  };
};

export interface EmprestimoStatusSummary {
  all: number;
  active: number;
  overdue: number;
  dueToday: number;
  completed: number;
}

/**
 * Totais GLOBAIS por status para os cartões-aba. A listagem é paginada no
 * servidor, então contar a partir da página carregada daria o total da página
 * (ex.: 7), não o real (ex.: 164). Aqui o backend conta a base inteira.
 */
export const getEmprestimoStatusSummary =
  async (): Promise<EmprestimoStatusSummary> => {
    const response = await api.get('/api/loans/status-summary');
    const data = response.data || {};
    return {
      all: data.all ?? 0,
      active: data.active ?? 0,
      overdue: data.overdue ?? 0,
      dueToday: data.dueToday ?? 0,
      completed: data.completed ?? 0,
    };
  };

export const getContagemAtrasados = async (): Promise<number> => {
  const response = await api.get('/api/loans/overdue');
  return response.status === 204 || !response.data ? 0 : response.data.length;
};

export const getContagemEmprestimosTotais = async (): Promise<number> => {
  const response = await api.get('/api/loans/active-and-overdue/count');
  return response.data || 0;
};

export const buscarEmprestimosAtivosEAtrasados = async (): Promise<
  EmprestimoAtivoDTO[]
> => {
  const response = await api.get('/api/loans/active-and-overdue');
  return (response.data || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    livroNome: item.bookTitle as string,
    leitorNome: item.readerName as string,
    leitorMatricula: item.readerRegistrationNumber as string,
    tombo: item.copyCode as string,
    dataEmprestimo: item.borrowedAt as string,
    dataDevolucao: item.dueAt as string,
    statusEmprestimo: loanStatusToPt(
      (item.status as { code?: string } | undefined)?.code,
    ),
  }));
};

export const buscarRanking = async (
  top: number = 10,
  cursoId?: number,
  moduloId?: number,
  turnoId?: number,
): Promise<LeitorRanking[]> => {
  const params: Record<string, number> = { top };

  if (cursoId) params.courseId = cursoId;
  if (moduloId) params.academicModuleId = moduloId;
  if (turnoId) params.studyShiftId = turnoId;

  const response = await api.get('/api/readers/ranking', { params });
  return (response.data || []).map((item: Record<string, unknown>) => ({
    matricula: item.registrationNumber as string,
    nome: item.fullName as string,
    emprestimosCount: Number(item.loanCount ?? item.emprestimosCount ?? 0),
  }));
};

export const buscarHistoricoLeitor = async (matricula: string) => {
  const response = await api.get(`/api/loans/reader/${matricula}/history`);
  return response.data;
};

export const buscarEmprestimosAtivosLeitor = async (matricula: string) => {
  const response = await api.get(`/api/loans/reader/${matricula}`);
  return response.data;
};

export const cadastrarEmprestimo = async (payload: EmprestimoPayload) => {
  const response = await api.post('/api/loans', {
    readerRegistrationNumber: payload.leitor_matricula,
    copyCode: payload.exemplar_tombo,
    borrowedAt: toOffsetDateTime(payload.data_emprestimo),
    dueAt: toOffsetDateTime(payload.data_devolucao),
  });
  return response.data;
};

export const atualizarEmprestimo = async (
  id: string | number,
  payload: EmprestimoPayload,
) => {
  const response = await api.put(`/api/loans/${id}`, {
    readerRegistrationNumber: payload.leitor_matricula,
    copyCode: payload.exemplar_tombo,
    borrowedAt: toOffsetDateTime(payload.data_emprestimo),
    dueAt: toOffsetDateTime(payload.data_devolucao),
  });
  return response.data;
};

export const concluirEmprestimo = async (id: string | number) => {
  const response = await api.put(`/api/loans/${id}/close`);
  return response.data;
};

export const excluirEmprestimo = async (id: string | number) => {
  const response = await api.delete(`/api/loans/${id}`);
  return response.data;
};
