import api from './api';
import type { Page } from '../types';

export interface Curso {
  id: number;
  nome: string;
}

export interface CursoPayload {
  nome: string;
  turno: string;
  modulo: string;
}

export interface CursoEstatistica {
  nomeCurso: string;
  quantidadeAlunos: number;
  totalEmprestimos: number;
  mediaEmprestimosPorAluno: number;
}

export interface EstatisticaGrafico {
  nome: string;
  total: number;
}

export const buscarCursos = async (): Promise<Page<Curso>> => {
  try {
    const response = await api.get('/api/v2/courses', {
      params: { size: 100 },
    });
    return {
      ...response.data,
      content: (response.data.content || []).map((item: Record<string, unknown>) => ({
        id: item.id as number,
        nome: item.name as string,
      })),
    };
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    throw error;
  }
};

export const cadastrarCurso = async (payload: CursoPayload): Promise<Curso> => {
  const response = await api.post('/api/v2/courses', {
    name: payload.nome,
  });
  return {
    id: response.data.id,
    nome: response.data.name,
  };
};

export const buscarEstatisticasCursos = async (): Promise<
  CursoEstatistica[]
> => {
  const response = await api.get('/api/v2/courses/statistics');
  return (response.data || []).map((item: Record<string, unknown>) => ({
    nomeCurso: item.courseName as string,
    quantidadeAlunos: item.studentCount as number,
    totalEmprestimos: item.totalLoans as number,
    mediaEmprestimosPorAluno: item.avgLoansPerStudent as number,
  }));
};

export const buscarEstatisticasGrafico = async (
  tipo: 'curso' | 'modulo' | 'turno',
): Promise<EstatisticaGrafico[]> => {
  const endpointMap = {
    curso: '/api/v2/courses/loan-statistics',
    modulo: '/api/v2/academic-modules/loan-statistics',
    turno: '/api/v2/study-shifts/loan-statistics',
  };

  const response = await api.get<Record<string, unknown>[]>(endpointMap[tipo]);
  return (response.data || []).map((item) => ({
    nome: item.name as string,
    total: item.total as number,
  }));
};
