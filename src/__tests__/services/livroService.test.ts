import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarLivrosParaAdmin,
  buscarLivrosAgrupados,
  excluirLivroComExemplares,
  buscarEnum,
} from '../../services/livroService';
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

describe('livroService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarLivrosParaAdmin', () => {
    it('deve buscar livros com parâmetros padrão', async () => {
      const mockData = {
        content: [{ isbn: '123', nome: 'Livro Teste' }],
        totalElements: 1,
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await buscarLivrosParaAdmin();

      expect(mockedApi.get).toHaveBeenCalledWith('/livros/home', {
        params: { texto: undefined, page: 0, size: 10, sort: 'nome,asc' },
      });
      expect(result.content).toHaveLength(1);
    });

    it('deve passar texto de busca e paginação personalizada', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await buscarLivrosParaAdmin('Harry', 2, 5, 'isbn,desc');

      expect(mockedApi.get).toHaveBeenCalledWith('/livros/home', {
        params: { texto: 'Harry', page: 2, size: 5, sort: 'isbn,desc' },
      });
    });
  });

  describe('buscarLivrosAgrupados', () => {
    it('deve buscar livros agrupados no endpoint correto', async () => {
      mockedApi.get.mockResolvedValue({
        data: { content: [{ id: 1, nome: 'Livro', quantidade: 3 }] },
      });

      const result = await buscarLivrosAgrupados('Livro');

      expect(mockedApi.get).toHaveBeenCalledWith('/livros/home/agrupado', {
        params: { texto: 'Livro', page: 0, size: 10, sort: 'nome,asc' },
      });
      expect(result.content[0].quantidade).toBe(3);
    });
  });

  describe('excluirLivroComExemplares', () => {
    it('deve excluir livro pelo ISBN', async () => {
      mockedApi.delete.mockResolvedValue({ data: { success: true } });

      await excluirLivroComExemplares('9788535914849');

      expect(mockedApi.delete).toHaveBeenCalledWith(
        '/livros/9788535914849/com-exemplares',
      );
    });
  });

  describe('buscarEnum', () => {
    it('deve buscar enum pelo tipo', async () => {
      const mockEnums = [
        { nome: 'LIVRE', status: 'Livre' },
        { nome: 'DEZ_ANOS', status: '10 anos' },
      ];
      mockedApi.get.mockResolvedValue({ data: mockEnums });

      const result = await buscarEnum('classificacao-etaria');

      expect(mockedApi.get).toHaveBeenCalledWith('/enums/classificacao-etaria');
      expect(result).toHaveLength(2);
    });
  });
});
