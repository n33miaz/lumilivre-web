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
  nomeAluno: (item.studentName as string) ?? '',
  matriculaAluno: (item.studentRegistrationNumber as string) ?? '',
  curso: (item.courseName as string) ?? '',
  dataEmprestimo: (item.borrowedAt as string) ?? '',
  dataDevolucao: (item.dueAt as string) ?? '',
});

export interface EmprestimoListagemDTO {
  id: string;
  statusEmprestimo: 'ATIVO' | 'ATRASADO' | 'CONCLUIDO';
  livroNome: string;
  livroTombo: string;
  nomeAluno: string;
  matriculaAluno: string;
  curso: string;
  dataEmprestimo: string;
  dataDevolucao: string;
}

export interface EmprestimoAtivoDTO {
  id: string;
  livroNome: string;
  alunoNome: string;
  alunoMatricula: string;
  tombo: string;
  dataEmprestimo: string;
  dataDevolucao: string;
  statusEmprestimo: 'ATIVO' | 'ATRASADO' | 'CONCLUIDO';
}

export interface AlunoRanking {
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
  alunoNome?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface EmprestimoPayload {
  id?: string | number;
  aluno_matricula: string;
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
      studentName: params.alunoNome,
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
    alunoNome: item.studentName as string,
    alunoMatricula: item.studentRegistrationNumber as string,
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
): Promise<AlunoRanking[]> => {
  const params: Record<string, number> = { top };

  if (cursoId) params.courseId = cursoId;
  if (moduloId) params.academicModuleId = moduloId;
  if (turnoId) params.studyShiftId = turnoId;

  const response = await api.get('/api/students/ranking', { params });
  return (response.data || []).map((item: Record<string, unknown>) => ({
    matricula: item.registrationNumber as string,
    nome: item.fullName as string,
    emprestimosCount: item.emprestimosCount as number,
  }));
};

export const buscarHistoricoAluno = async (matricula: string) => {
  const response = await api.get(`/api/loans/student/${matricula}/history`);
  return response.data;
};

export const buscarEmprestimosAtivosAluno = async (matricula: string) => {
  const response = await api.get(`/api/loans/student/${matricula}`);
  return response.data;
};

export const cadastrarEmprestimo = async (payload: EmprestimoPayload) => {
  const response = await api.post('/api/loans', {
    studentRegistrationNumber: payload.aluno_matricula,
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
    studentRegistrationNumber: payload.aluno_matricula,
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
