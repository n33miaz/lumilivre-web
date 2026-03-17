import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import {
  cadastrarEmprestimo,
  concluirEmprestimo,
  excluirEmprestimo,
  atualizarEmprestimo,
  buscarEmprestimosPaginado,
  buscarEmprestimosAvancado,
  getContagemAtrasados,
  getContagemEmprestimosTotais,
  buscarEmprestimosAtivosEAtrasados,
  buscarRanking,
  buscarHistoricoAluno,
  buscarEmprestimosAtivosAluno,
} from '../../services/emprestimoService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('emprestimoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- AÇÕES DE ESCRITA ---

  describe('cadastrarEmprestimo', () => {
    it('deve enviar payload correto ao cadastrar', async () => {
      const payload = {
        aluno_matricula: '12345',
        exemplar_tombo: '001',
        data_emprestimo: '11/03/2026 15:00:00',
        data_devolucao: '18/03/2026 15:00:00',
      };
      mockedApi.post.mockResolvedValue({ data: { id: 1, ...payload } });

      const result = await cadastrarEmprestimo(payload);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/emprestimos/cadastrar',
        payload,
      );
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('atualizarEmprestimo', () => {
    it('deve atualizar empréstimo pelo ID', async () => {
      const payload = {
        aluno_matricula: '12345',
        exemplar_tombo: '001',
        data_emprestimo: '11/03/2026 15:00:00',
        data_devolucao: '25/03/2026 15:00:00',
      };
      mockedApi.put.mockResolvedValue({ data: { sucesso: true } });

      await atualizarEmprestimo(1, payload);

      expect(mockedApi.put).toHaveBeenCalledWith(
        '/emprestimos/atualizar/1',
        payload,
      );
    });
  });

  describe('concluirEmprestimo', () => {
    it('deve chamar a rota correta ao concluir', async () => {
      mockedApi.put.mockResolvedValue({ data: { sucesso: true } });

      await concluirEmprestimo(99);

      expect(mockedApi.put).toHaveBeenCalledWith('/emprestimos/concluir/99');
    });
  });

  describe('excluirEmprestimo', () => {
    it('deve chamar a rota correta ao excluir', async () => {
      mockedApi.delete.mockResolvedValue({ data: { sucesso: true } });

      await excluirEmprestimo(42);

      expect(mockedApi.delete).toHaveBeenCalledWith('/emprestimos/excluir/42');
    });
  });

  // --- BUSCAS ---

  describe('buscarEmprestimosPaginado', () => {
    it('deve usar endpoint /home quando não há texto de busca', async () => {
      mockedApi.get.mockResolvedValue({
        data: { content: [], totalElements: 0 },
      });

      await buscarEmprestimosPaginado('', 0, 10, 'dataEmprestimo,desc');

      expect(mockedApi.get).toHaveBeenCalledWith('/emprestimos/home', {
        params: {
          page: 0,
          size: 10,
          sort: 'dataEmprestimo,desc',
          texto: undefined,
        },
      });
    });

    it('deve usar endpoint /buscar quando há texto de busca', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await buscarEmprestimosPaginado('João', 0, 10, 'dataEmprestimo,desc');

      expect(mockedApi.get).toHaveBeenCalledWith('/emprestimos/buscar', {
        params: {
          page: 0,
          size: 10,
          sort: 'dataEmprestimo,desc',
          texto: 'João',
        },
      });
    });
  });

  describe('buscarEmprestimosAvancado', () => {
    it('deve remover parâmetros vazios antes de enviar', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await buscarEmprestimosAvancado({
        statusEmprestimo: 'ATIVO',
        livroNome: '',
        alunoNome: undefined,
        page: 0,
        size: 10,
        sort: 'dataEmprestimo,desc',
      });

      const callParams = mockedApi.get.mock.calls[0][1]?.params;
      expect(callParams.statusEmprestimo).toBe('ATIVO');
      expect(callParams).not.toHaveProperty('livroNome');
      expect(callParams).not.toHaveProperty('alunoNome');
    });
  });

  describe('getContagemAtrasados', () => {
    it('deve retornar contagem de atrasados', async () => {
      const mockAtrasados = [{ id: 1 }, { id: 2 }, { id: 3 }];
      mockedApi.get.mockResolvedValue({ data: mockAtrasados, status: 200 });

      const result = await getContagemAtrasados();

      expect(result).toBe(3);
    });

    it('deve retornar 0 quando status é 204 (sem conteúdo)', async () => {
      mockedApi.get.mockResolvedValue({ data: null, status: 204 });

      const result = await getContagemAtrasados();

      expect(result).toBe(0);
    });

    it('deve propagar erro em caso de falha crítica', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server Error'));

      await expect(getContagemAtrasados()).rejects.toThrow('Server Error');
    });
  });

  describe('getContagemEmprestimosTotais', () => {
    it('deve retornar a contagem total de empréstimos ativos e atrasados', async () => {
      mockedApi.get.mockResolvedValue({ data: 15 });

      const result = await getContagemEmprestimosTotais();

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/emprestimos/contagem/ativos-e-atrasados',
      );
      expect(result).toBe(15);
    });

    it('deve retornar 0 quando resposta é falsy', async () => {
      mockedApi.get.mockResolvedValue({ data: 0 });

      const result = await getContagemEmprestimosTotais();

      expect(result).toBe(0);
    });
  });

  describe('buscarEmprestimosAtivosEAtrasados', () => {
    it('deve retornar lista de empréstimos ativos e atrasados', async () => {
      const mockList = [
        { id: 1, livroNome: 'Livro A', statusEmprestimo: 'ATIVO' },
      ];
      mockedApi.get.mockResolvedValue({ data: mockList });

      const result = await buscarEmprestimosAtivosEAtrasados();

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/emprestimos/buscar/ativos-e-atrasados',
      );
      expect(result).toHaveLength(1);
    });

    it('deve retornar array vazio quando resposta é null', async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      const result = await buscarEmprestimosAtivosEAtrasados();

      expect(result).toEqual([]);
    });
  });

  describe('buscarRanking', () => {
    it('deve buscar ranking com parâmetros padrão', async () => {
      const mockRanking = [
        { matricula: '001', nome: 'João', emprestimosCount: 10 },
      ];
      mockedApi.get.mockResolvedValue({ data: mockRanking });

      const result = await buscarRanking();

      expect(mockedApi.get).toHaveBeenCalledWith('/emprestimos/ranking', {
        params: { top: 10 },
      });
      expect(result).toHaveLength(1);
    });

    it('deve passar filtros opcionais de curso, módulo e turno', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      await buscarRanking(5, 1, 2, 3);

      expect(mockedApi.get).toHaveBeenCalledWith('/emprestimos/ranking', {
        params: { top: 5, cursoId: 1, moduloId: 2, turnoId: 3 },
      });
    });
  });

  // --- HISTÓRICO DO ALUNO ---

  describe('buscarHistoricoAluno', () => {
    it('deve buscar histórico pela matrícula', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ id: 1 }] });

      const result = await buscarHistoricoAluno('2024001');

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/emprestimos/aluno/2024001/historico',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('buscarEmprestimosAtivosAluno', () => {
    it('deve buscar empréstimos ativos pela matrícula', async () => {
      mockedApi.get.mockResolvedValue({
        data: [{ id: 5, statusEmprestimo: 'ATIVO' }],
      });

      const result = await buscarEmprestimosAtivosAluno('2024001');

      expect(mockedApi.get).toHaveBeenCalledWith('/emprestimos/aluno/2024001');
      expect(result[0].statusEmprestimo).toBe('ATIVO');
    });
  });
});
