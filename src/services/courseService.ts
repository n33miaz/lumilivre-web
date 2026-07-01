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
  quantidadeLeitores: number;
  totalEmprestimos: number;
  mediaEmprestimosPorLeitor: number;
}

export interface EstatisticaGrafico {
  nome: string;
  total: number;
}

export const buscarCursos = async (): Promise<Page<Curso>> => {
  try {
    const response = await api.get('/api/courses', {
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
  const response = await api.post('/api/courses', {
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
  const response = await api.get('/api/courses/statistics');
  return (response.data || []).map((item: Record<string, unknown>) => ({
    nomeCurso: item.courseName as string,
    quantidadeLeitores: item.readerCount as number,
    totalEmprestimos: item.totalLoans as number,
    mediaEmprestimosPorLeitor: item.avgLoansPerReader as number,
  }));
};

export const buscarEstatisticasGrafico = async (
  tipo: 'curso' | 'modulo' | 'turno',
): Promise<EstatisticaGrafico[]> => {
  const endpointMap = {
    curso: '/api/courses/loan-statistics',
    modulo: '/api/academic-modules/loan-statistics',
    turno: '/api/study-shifts/loan-statistics',
  };

  const response = await api.get<Record<string, unknown>[]>(endpointMap[tipo]);
  return (response.data || []).map((item) => ({
    nome: item.name as string,
    total: item.total as number,
  }));
};
