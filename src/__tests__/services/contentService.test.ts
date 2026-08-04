import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listarConteudos,
  buscarConteudoPorId,
  listarConteudosAvancado,
  cadastrarConteudo,
  atualizarConteudo,
  excluirConteudo,
  type ContentPayload,
} from '../../services/contentService';
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

const mockPayload: ContentPayload = {
  contentType: 'ANNOUNCEMENT',
  title: 'Comunicado importante',
  published: true,
  pinned: false,
  displayOrder: 0,
  audienceScope: 'ALL',
};

describe('contentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listarConteudos maps results', async () => {
    mockedApi.get.mockResolvedValue({
      data: [{ id: 'c1', title: 'Aviso', contentType: { code: 'WORK', label: 'Trabalho' } }],
    });

    const result = await listarConteudos('Aviso');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/contents', {
      params: { q: 'Aviso', type: undefined },
    });
    expect(result[0].title).toBe('Aviso');
    expect(result[0].contentType.code).toBe('WORK');
  });

  it('buscarConteudoPorId uses detail route', async () => {
    mockedApi.get.mockResolvedValue({ data: { id: 'c5', title: 'Especifico' } });

    const result = await buscarConteudoPorId('c5');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/contents/c5');
    expect(result.id).toBe('c5');
  });

  it('listarConteudosAvancado maps filters', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });

    await listarConteudosAvancado({ type: 'WORK', scope: 'COURSE', courseId: '1', year: '2025' });

    expect(mockedApi.get).toHaveBeenCalledWith('/api/contents/search', {
      params: { type: 'WORK', scope: 'COURSE', courseId: '1', year: '2025' },
    });
  });

  it('cadastrarConteudo posts multipart data', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'c1', title: 'Comunicado importante' } });

    await cadastrarConteudo(mockPayload);

    expect(mockedApi.post).toHaveBeenCalledWith('/api/contents', expect.any(FormData));
    const formData = mockedApi.post.mock.calls[0][1] as FormData;
    expect(formData.get('data')).toContain('"title":"Comunicado importante"');
  });

  it('atualizarConteudo and excluirConteudo use routes', async () => {
    mockedApi.put.mockResolvedValue({ data: { id: 'c1', title: 'C' } });
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await atualizarConteudo('c1', mockPayload);
    await excluirConteudo('c1');

    expect(mockedApi.put).toHaveBeenCalledWith('/api/contents/c1', expect.any(FormData));
    expect(mockedApi.delete).toHaveBeenCalledWith('/api/contents/c1');
  });
});
