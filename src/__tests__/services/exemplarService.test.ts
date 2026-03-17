import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarExemplaresPorLivroId,
  cadastrarExemplar,
  atualizarExemplar,
  excluirExemplar,
  type ExemplarPayload,
  type ExemplarUpdatePayload,
} from '../../services/exemplarService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('exemplarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarExemplaresPorLivroId', () => {
    it('deve buscar exemplares pelo ID do livro', async () => {
      const mockExemplares = [
        { tomboExemplar: 'T001', status: 'DISPONIVEL', isbn: '123' },
        { tomboExemplar: 'T002', status: 'EMPRESTADO', isbn: '123' },
      ];
      mockedApi.get.mockResolvedValue({ data: mockExemplares });

      const result = await buscarExemplaresPorLivroId(42);

      expect(mockedApi.get).toHaveBeenCalledWith('/livros/exemplares/livro/42');
      expect(result).toHaveLength(2);
      expect(result[0].tomboExemplar).toBe('T001');
    });
  });

  describe('cadastrarExemplar', () => {
    it('deve cadastrar um exemplar com payload correto', async () => {
      const payload: ExemplarPayload = {
        tombo: 'T100',
        livro_id: 5,
        status_livro: 'DISPONIVEL',
        localizacao_fisica: 'Estante A3',
      };
      mockedApi.post.mockResolvedValue({ data: { tombo: 'T100' } });

      const result = await cadastrarExemplar(payload);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/livros/exemplares/cadastrar',
        payload,
      );
      expect(result.tombo).toBe('T100');
    });
  });

  describe('atualizarExemplar', () => {
    it('deve atualizar exemplar pelo tombo atual', async () => {
      const payload: ExemplarUpdatePayload = {
        tombo: 'T100-NEW',
        localizacao_fisica: 'Estante B1',
        livro_id: 5,
        status_livro: 'DISPONIVEL',
      };
      mockedApi.put.mockResolvedValue({ data: { sucesso: true } });

      await atualizarExemplar('T100', payload);

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/livros/exemplares/atualizar/T100',
        payload,
      );
    });
  });

  describe('excluirExemplar', () => {
    it('deve excluir exemplar pelo tombo', async () => {
      mockedApi.delete.mockResolvedValue({ data: { sucesso: true } });

      await excluirExemplar('T100');

      expect(mockedApi.delete).toHaveBeenCalledWith(
        '/livros/exemplares/excluir/T100',
      );
    });
  });
});
