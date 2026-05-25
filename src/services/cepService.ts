import api from './api';

interface Endereco {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  error?: boolean | string;
}

interface PostalCodeResponse {
  street?: string;
  district?: string;
  city?: string;
  stateCode?: string;
}

export const buscarEnderecoPorCep = async (cep: string): Promise<Endereco> => {
  try {
    const response = await api.get<PostalCodeResponse>(
      `/api/metadata/postal-codes/${cep}`,
    );
    return {
      logradouro: response.data.street || '',
      bairro: response.data.district || '',
      localidade: response.data.city || '',
      uf: response.data.stateCode || '',
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};
