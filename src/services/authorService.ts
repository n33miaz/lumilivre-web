import api from './api';

export const getContagemAutores = async (): Promise<number> => {
  const response = await api.get('/api/v2/metadata/authors', {
    params: { page: 0, size: 1 },
  });
  return response.data.totalElements || 0;
};
