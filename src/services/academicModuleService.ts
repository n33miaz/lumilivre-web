import api from './api';

export interface Modulo {
  id: number;
  nome: string;
}

export interface ModuloPayload {
  nome: string;
}

export const buscarModulos = async (): Promise<Modulo[]> => {
  try {
    const response = await api.get('/api/academic-modules', {
      params: { size: 100 },
    });
    return (response.data?.content || []).map((item: Record<string, unknown>) => ({
      id: item.id as number,
      nome: item.name as string,
    }));
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return [];
  }
};

export const cadastrarModulo = async (
  payload: ModuloPayload,
): Promise<Modulo> => {
  const response = await api.post('/api/academic-modules', {
    name: payload.nome,
  });
  return {
    id: response.data.id,
    nome: response.data.name,
  };
};
