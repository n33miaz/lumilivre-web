import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listarTccs,
  buscarTccPorId,
  listarTccsAvancado,
  cadastrarTcc,
  atualizarTcc,
  excluirTcc,
  type TccPayload,
} from '../../services/tccService';
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
  titulo: 'Sistema de Gestão Bibliotecária',
  alunos: 'João, Maria',
  orientadores: 'Prof. Silva',
  curso_id: 1,
  anoConclusao: '2025',
  semestreConclusao: '1',
  linkExterno: 'https://example.com',
  ativo: true,
};

describe('tccService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listarTccs', () => {
    it('deve listar TCCs sem filtro de texto', async () => {
      const mockData = [{ id: 1, titulo: 'TCC Teste' }];
      mockedApi.get.mockResolvedValue({ data: { data: mockData } });

      const result = await listarTccs();

      expect(mockedApi.get).toHaveBeenCalledWith('/tcc/buscar', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('deve listar TCCs com filtro de texto', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      await listarTccs('Sistema');

      expect(mockedApi.get).toHaveBeenCalledWith('/tcc/buscar', {
        params: { texto: 'Sistema' },
      });
    });

    it('deve retornar array vazio quando data é undefined', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: undefined } });

      const result = await listarTccs();

      expect(result).toEqual([]);
    });
  });

  describe('buscarTccPorId', () => {
    it('deve buscar TCC pelo ID', async () => {
      const mockTcc = { id: 5, titulo: 'TCC Específico' };
      mockedApi.get.mockResolvedValue({ data: { data: mockTcc } });

      const result = await buscarTccPorId(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/tcc/buscar/5');
      expect(result).toEqual(mockTcc);
    });
  });

  describe('listarTccsAvancado', () => {
    it('deve buscar TCCs com filtros avançados', async () => {
      const params = { cursoId: '1', semestre: '2', ano: '2025' };
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      const result = await listarTccsAvancado(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/tcc/buscar/avancado', {
        params,
      });
      expect(result).toEqual([]);
    });
  });

  describe('cadastrarTcc', () => {
    it('deve cadastrar TCC sem arquivos', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 1 } });

      const result = await cadastrarTcc(mockTccPayload);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/tcc/cadastrar',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      expect(result).toEqual({ id: 1 });
    });

    it('deve cadastrar TCC com PDF e foto', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 2 } });
      const filePdf = new File(['pdf'], 'tcc.pdf', { type: 'application/pdf' });
      const fileFoto = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });

      await cadastrarTcc(mockTccPayload, filePdf, fileFoto);

      const formData = mockedApi.post.mock.calls[0][1] as FormData;
      expect(formData.get('arquivoPdf')).toBeTruthy();
      expect(formData.get('arquivoFoto')).toBeTruthy();
    });
  });

  describe('atualizarTcc', () => {
    it('deve atualizar TCC pelo ID', async () => {
      mockedApi.put.mockResolvedValue({ data: { sucesso: true } });

      await atualizarTcc(1, mockTccPayload);

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/tcc/atualizar/1',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
    });
  });

  describe('excluirTcc', () => {
    it('deve excluir TCC pelo ID', async () => {
      mockedApi.delete.mockResolvedValue({ data: { sucesso: true } });

      await excluirTcc(10);

      expect(mockedApi.delete).toHaveBeenCalledWith('/tcc/excluir/10');
    });
  });
});
