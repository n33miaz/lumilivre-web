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

  it('maps the v2 ISBN lookup response to the book form shape', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        publisher: 'Prentice Hall',
        publicationDate: '2008-08-01',
        pageCount: 464,
        genres: ['Programacao'],
        synopsis: 'Um livro sobre codigo limpo.',
        coverUrl: 'https://example.com/cover.jpg',
      },
    });

    const result = await buscarLivroPorIsbn('9780132350884');

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/v2/books/isbn/9780132350884',
    );
    expect(result.nome).toBe('Clean Code');
    expect(result.autor).toBe('Robert C. Martin');
  });

  it('throws a user-facing error when the lookup fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('Not found'));

    await expect(buscarLivroPorIsbn('0000000000')).rejects.toThrow(
      'Livro n',
    );
  });
});
