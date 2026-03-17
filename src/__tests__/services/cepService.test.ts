import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buscarEnderecoPorCep } from '../../services/cepService';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('cepService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarEnderecoPorCep', () => {
    it('deve retornar o endereço para um CEP válido', async () => {
      const mockEndereco = {
        logradouro: 'Rua das Flores',
        bairro: 'Centro',
        localidade: 'São Paulo',
        uf: 'SP',
      };
      mockedAxios.get.mockResolvedValue({ data: mockEndereco });

      const result = await buscarEnderecoPorCep('01001000');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01001000/json/',
      );
      expect(result.logradouro).toBe('Rua das Flores');
      expect(result.uf).toBe('SP');
    });

    it('deve lançar erro quando CEP não é encontrado', async () => {
      mockedAxios.get.mockResolvedValue({ data: { erro: true } });

      await expect(buscarEnderecoPorCep('00000000')).rejects.toThrow(
        'CEP não encontrado.',
      );
    });

    it('deve lançar erro quando a requisição falha', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(buscarEnderecoPorCep('99999999')).rejects.toThrow();
    });
  });
});
