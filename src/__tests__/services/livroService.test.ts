import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarLivrosParaAdmin,
  buscarLivrosAgrupados,
  buscarLivrosAvancado,
  cadastrarLivro,
  atualizarLivro,
  excluirLivroComExemplares,
  buscarEnum,
  buscarLivroPorId,
} from '../../services/bookService';
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

describe('bookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buscarLivrosParaAdmin uses v2 search and maps copy rows', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        content: [
          {
            copyCode: 'T001',
            copyStatus: { code: 'AVAILABLE', label: 'Disponivel' },
            isbn: '123',
            title: 'Livro Teste',
            author: 'Autor',
            publisher: 'Editora',
          },
        ],
        totalElements: 1,
      },
    });

    const result = await buscarLivrosParaAdmin();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/books/search', {
      params: { q: undefined, page: 0, size: 10, sort: 'title,asc' },
    });
    expect(result.content[0].nome).toBe('Livro Teste');
    expect(result.content[0].status).toBe('DISPONIVEL');
  });

  it('buscarLivrosAgrupados uses v2 grouped books', async () => {
    mockedApi.get.mockResolvedValue({
      data: { content: [{ id: 'book-1', title: 'Livro', copyCount: 3 }] },
    });

    const result = await buscarLivrosAgrupados('Livro');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/books/grouped', {
      params: { q: 'Livro', page: 0, size: 10, sort: 'title,asc' },
    });
    expect(result.content[0].id).toBe('book-1');
    expect(result.content[0].quantidade).toBe(3);
  });

  it('buscarLivrosAvancado maps filters to v2 names', async () => {
    mockedApi.get.mockResolvedValue({ data: { content: [] } });

    await buscarLivrosAvancado({
      nome: 'Livro',
      editora: 'Editora A',
      cdd: '000',
      page: 1,
      size: 20,
      sort: 'nome,desc',
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/books/advanced', {
      params: expect.objectContaining({
        title: 'Livro',
        publisher: 'Editora A',
        deweyCode: '000',
        page: 1,
        size: 20,
        sort: 'title,desc',
      }),
    });
  });

  it('cadastrarLivro posts JSON to v2 and uploads cover separately when needed', async () => {
    const file = new File(['img'], 'cover.png', { type: 'image/png' });
    mockedApi.post
      .mockResolvedValueOnce({ data: { id: 'book-1', title: 'Livro' } })
      .mockResolvedValueOnce({ data: { id: 'book-1', title: 'Livro' } });

    await cadastrarLivro(
      {
        isbn: '1234567890',
        nome: 'Livro',
        autor: 'Autor',
        editora: 'Editora',
        data_lancamento: '2026-01-01',
        numero_paginas: 120,
        cdd: '000',
        classificacao_etaria: 'LIVRE',
        tipo_capa: 'BROCHURA',
        generos: ['Romance'],
      },
      file,
    );

    expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/api/v2/books', {
      isbn: '1234567890',
      title: 'Livro',
      author: 'Autor',
      publisher: 'Editora',
      publicationDate: '2026-01-01',
      pageCount: 120,
      deweyCode: '000',
      ageRating: 'LIVRE',
      edition: undefined,
      volume: undefined,
      synopsis: undefined,
      coverType: 'BROCHURA',
      coverUrl: undefined,
      genres: ['Romance'],
    });
    expect(mockedApi.post).toHaveBeenNthCalledWith(
      2,
      '/api/v2/books/book-1/cover',
      expect.any(FormData),
    );
  });

  it('atualizarLivro and delete use v2 routes', async () => {
    mockedApi.put.mockResolvedValue({ data: { id: 'book-1', title: 'Livro' } });
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await atualizarLivro('book-1', {
      isbn: '1234567890',
      nome: 'Livro',
      autor: 'Autor',
      editora: 'Editora',
      data_lancamento: '',
      numero_paginas: 120,
      cdd: '',
      classificacao_etaria: 'LIVRE',
      tipo_capa: 'BROCHURA',
      generos: ['Romance'],
    });
    await excluirLivroComExemplares('book-1');

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/api/v2/books/book-1',
      expect.objectContaining({ title: 'Livro' }),
    );
    expect(mockedApi.delete).toHaveBeenCalledWith('/api/v2/books/book-1');
  });

  it('buscarLivroPorId maps v2 detail to the form shape', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        id: 'book-1',
        title: 'Livro',
        ageRating: { code: 'LIVRE', label: 'Livre' },
        coverType: { code: 'BROCHURA', label: 'Brochura' },
      },
    });

    const result = await buscarLivroPorId('book-1');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/books/book-1');
    expect(result.data.nome).toBe('Livro');
    expect(result.data.classificacaoEtariaRaw).toBe('LIVRE');
  });

  it('buscarEnum maps localized enum items', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        { code: 'LIVRE', label: 'Livre' },
        { code: 'DEZ_ANOS', label: '10 anos' },
      ],
    });

    const result = await buscarEnum('classificacao-etaria');

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/v2/metadata/enums/classificacao-etaria',
    );
    expect(result[0]).toEqual({ nome: 'LIVRE', status: 'Livre' });
  });
});
