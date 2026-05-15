import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarExemplaresPorLivroId,
  cadastrarExemplar,
  atualizarExemplar,
  excluirExemplar,
  type ExemplarPayload,
  type ExemplarUpdatePayload,
} from '../../services/bookCopyService';
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

describe('bookCopyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buscarExemplaresPorLivroId uses v2 and maps copy rows', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        {
          copyCode: 'T001',
          status: { code: 'AVAILABLE', label: 'Disponivel' },
          isbn: '123',
          title: 'Livro',
          shelfLocation: 'A1',
        },
      ],
    });

    const result = await buscarExemplaresPorLivroId('book-1');

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/v2/book-copies/by-book/book-1',
    );
    expect(result[0].tomboExemplar).toBe('T001');
    expect(result[0].status).toBe('DISPONIVEL');
  });

  it('cadastrarExemplar sends a v2 payload', async () => {
    const payload: ExemplarPayload = {
      tombo: 'T100',
      livro_id: 'book-1',
      status_livro: 'DISPONIVEL',
      localizacao_fisica: 'Estante A3',
    };
    mockedApi.post.mockResolvedValue({ data: { copyCode: 'T100' } });

    await cadastrarExemplar(payload);

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v2/book-copies', {
      copyCode: 'T100',
      bookId: 'book-1',
      status: 'AVAILABLE',
      shelfLocation: 'Estante A3',
    });
  });

  it('atualizarExemplar uses v2 update by copy code', async () => {
    const payload: ExemplarUpdatePayload = {
      tombo: 'T100-NEW',
      localizacao_fisica: 'Estante B1',
      livro_id: 'book-1',
      status_livro: 'DISPONIVEL',
    };
    mockedApi.put.mockResolvedValue({ data: { copyCode: 'T100-NEW' } });

    await atualizarExemplar('T100', payload);

    expect(mockedApi.put).toHaveBeenCalledWith('/api/v2/book-copies/T100', {
      copyCode: 'T100-NEW',
      bookId: 'book-1',
      status: 'AVAILABLE',
      shelfLocation: 'Estante B1',
    });
  });

  it('excluirExemplar uses v2 delete by copy code', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await excluirExemplar('T100');

    expect(mockedApi.delete).toHaveBeenCalledWith('/api/v2/book-copies/T100');
  });
});
