import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarSolicitacoesPendentes,
  processarSolicitacao,
} from '../../services/solicitacaoEmprestimoService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('solicitacaoEmprestimoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarSolicitacoesPendentes', () => {
    it('deve retornar lista de solicitações pendentes', async () => {
      const mockSolicitacoes = [
        { id: 1, alunoNome: 'João', livroNome: 'Dom Casmurro', dataSolicitacao: '2026-03-10' },
        { id: 2, alunoNome: 'Maria', livroNome: 'Clean Code', dataSolicitacao: '2026-03-11' },
      ];
      mockedApi.get.mockResolvedValue({ data: mockSolicitacoes });

      const result = await buscarSolicitacoesPendentes();

      expect(mockedApi.get).toHaveBeenCalledWith('/solicitacoes/pendentes');
      expect(result).toHaveLength(2);
      expect(result[0].alunoNome).toBe('João');
    });

    it('deve retornar array vazio quando resposta é null', async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      const result = await buscarSolicitacoesPendentes();

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio em caso de erro', async () => {
      mockedApi.get.mockRejectedValue(new Error('Erro de rede'));

      const result = await buscarSolicitacoesPendentes();

      expect(result).toEqual([]);
    });
  });

  describe('processarSolicitacao', () => {
    it('deve aceitar uma solicitação', async () => {
      mockedApi.post.mockResolvedValue({ data: { sucesso: true } });

      await processarSolicitacao(1, true);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/solicitacoes/processar/1',
        null,
        { params: { aceitar: true } },
      );
    });

    it('deve recusar uma solicitação', async () => {
      mockedApi.post.mockResolvedValue({ data: { sucesso: true } });

      await processarSolicitacao(2, false);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/solicitacoes/processar/2',
        null,
        { params: { aceitar: false } },
      );
    });
  });
});
