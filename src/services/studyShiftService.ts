import api from './api';

export interface Turno {
  id: number;
  nome: string;
}

export interface TurnoPayload {
  nome: string;
}

export const buscarTurnos = async (): Promise<Turno[]> => {
  const response = await api.get('/api/study-shifts', {
    params: { size: 100 },
  });
  return (response.data?.content || []).map((item: Record<string, unknown>) => ({
    id: item.id as number,
    nome: item.name as string,
  }));
};

export const cadastrarTurno = async (payload: TurnoPayload): Promise<Turno> => {
  const response = await api.post('/api/study-shifts', {
    name: payload.nome,
  });
  return {
    id: response.data.id,
    nome: response.data.name,
  };
};
