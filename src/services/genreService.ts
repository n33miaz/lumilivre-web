import api from './api';

export interface Genero {
  id: number;
  nome: string;
  nomePtBr?: string;
}

export const buscarGeneros = async (): Promise<Genero[]> => {
  const response = await api.get('/api/genres');
  return (response.data || []).map((item: Record<string, unknown>) => ({
    id: item.id as number,
    nome: item.name as string,
  }));
};
