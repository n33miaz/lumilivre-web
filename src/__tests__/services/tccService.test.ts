import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listarTccs,
  buscarTccPorId,
  listarTccsAvancado,
  cadastrarTcc,
  atualizarTcc,
  excluirTcc,
  type TccPayload,
} from '../../services/thesisService';
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

const mockTccPayload: TccPayload = {
  titulo: 'Sistema de Gestao Bibliotecaria',
  leitores: 'Joao, Maria',
  orientadores: 'Prof. Silva',
  curso_id: 1,
  anoConclusao: '2025',
  semestreConclusao: '1',
  linkExterno: 'https://example.com',
  ativo: true,
};

describe('thesisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listarTccs uses v2 and maps results', async () => {
    mockedApi.get.mockResolvedValue({
      data: [{ id: 'tcc-1', title: 'TCC Teste', authors: 'Joao' }],
    });

    const result = await listarTccs('Sistema');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/theses', {
      params: { q: 'Sistema' },
    });
    expect(result[0].titulo).toBe('TCC Teste');
    expect(result[0].leitores).toBe('Joao');
  });

  it('buscarTccPorId uses v2 detail route', async () => {
    mockedApi.get.mockResolvedValue({
      data: { id: 'tcc-5', title: 'TCC Especifico' },
    });

    const result = await buscarTccPorId('tcc-5');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/theses/tcc-5');
    expect(result.id).toBe('tcc-5');
  });

  it('listarTccsAvancado maps filters to v2 names', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });

    await listarTccsAvancado({ cursoId: '1', semestre: '2', ano: '2025' });

    expect(mockedApi.get).toHaveBeenCalledWith('/api/theses/search', {
      params: { courseId: '1', semester: '2', year: '2025' },
    });
  });

  it('cadastrarTcc posts multipart data to v2', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'tcc-1', title: 'TCC' } });

    await cadastrarTcc(mockTccPayload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/api/theses',
      expect.any(FormData),
    );
    const formData = mockedApi.post.mock.calls[0][1] as FormData;
    expect(formData.get('data')).toContain('"title":"Sistema de Gestao');
  });

  it('atualizarTcc and excluirTcc use v2 routes', async () => {
    mockedApi.put.mockResolvedValue({ data: { id: 'tcc-1', title: 'TCC' } });
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await atualizarTcc('tcc-1', mockTccPayload);
    await excluirTcc('tcc-1');

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/api/theses/tcc-1',
      expect.any(FormData),
    );
    expect(mockedApi.delete).toHaveBeenCalledWith('/api/theses/tcc-1');
  });
});
