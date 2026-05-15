import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buscarEnderecoPorCep } from '../../services/cepService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('cepService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarEnderecoPorCep', () => {
    it('deve retornar o endereco para um CEP valido', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          street: 'Rua das Flores',
          district: 'Centro',
          city: 'Sao Paulo',
          stateCode: 'SP',
        },
      });

      const result = await buscarEnderecoPorCep('01001000');

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/api/v2/metadata/postal-codes/01001000',
      );
      expect(result.logradouro).toBe('Rua das Flores');
      expect(result.uf).toBe('SP');
    });

    it('deve lancar erro quando CEP nao e encontrado', async () => {
      mockedApi.get.mockRejectedValue(new Error('CEP nao encontrado.'));

      await expect(buscarEnderecoPorCep('00000000')).rejects.toThrow(
        'CEP nao encontrado.',
      );
    });

    it('deve lancar erro quando a requisicao falha', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network Error'));

      await expect(buscarEnderecoPorCep('99999999')).rejects.toThrow();
    });
  });
});
