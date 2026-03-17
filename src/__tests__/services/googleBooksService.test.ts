import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buscarLivroPorIsbn } from '../../services/googleBooksService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('googleBooksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarLivroPorIsbn', () => {
    it('deve retornar dados do livro para um ISBN válido', async () => {
      const mockLivro = {
        nome: 'Clean Code',
        autor: 'Robert C. Martin',
        editora: 'Prentice Hall',
        data_lancamento: '2008-08-01',
        numero_paginas: 464,
        generos: ['Programação'],
        sinopse: 'Um livro sobre código limpo.',
        imagem: 'https://example.com/cover.jpg',
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockLivro } });

      const result = await buscarLivroPorIsbn('9780132350884');

      expect(mockedApi.get).toHaveBeenCalledWith('/livros/consulta-isbn/9780132350884');
      expect(result.nome).toBe('Clean Code');
      expect(result.autor).toBe('Robert C. Martin');
    });

    it('deve lançar erro quando livro não é encontrado', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not found'));

      await expect(buscarLivroPorIsbn('0000000000')).rejects.toThrow(
        'Livro não encontrado nas bases de dados.',
      );
    });
  });
});
