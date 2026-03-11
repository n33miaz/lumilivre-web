import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarAlunosParaAdmin,
  cadastrarAluno,
  excluirAluno,
  buscarAlunoPorMatricula,
  type AlunoPayload,
} from '../../services/alunoService';
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

describe('alunoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buscarAlunosParaAdmin', () => {
    it('deve buscar alunos com parâmetros padrão', async () => {
      const mockResponse = {
        data: {
          content: [{ matricula: '001', nomeCompleto: 'João' }],
          totalElements: 1,
          totalPages: 1,
        },
      };
      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await buscarAlunosParaAdmin();

      expect(mockedApi.get).toHaveBeenCalledWith('/alunos/home', {
        params: { texto: undefined, page: 0, size: 10, sort: 'nomeCompleto,asc' },
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].nomeCompleto).toBe('João');
    });

    it('deve passar texto de busca quando fornecido', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await buscarAlunosParaAdmin('Maria', 1, 20, 'matricula,desc');

      expect(mockedApi.get).toHaveBeenCalledWith('/alunos/home', {
        params: { texto: 'Maria', page: 1, size: 20, sort: 'matricula,desc' },
      });
    });
  });

  describe('cadastrarAluno', () => {
    it('deve enviar dados do aluno via POST', async () => {
      const alunoData: AlunoPayload = {
        matricula: '2024001',
        nomeCompleto: 'Novo Aluno',
        cpf: '12345678900',
        email: 'aluno@email.com',
        cursoId: 1,
        turnoId: 1,
        moduloId: 1,
      };
      mockedApi.post.mockResolvedValue({ data: { matricula: '2024001' } });

      const result = await cadastrarAluno(alunoData);

      expect(mockedApi.post).toHaveBeenCalledWith('/alunos/cadastrar', alunoData);
      expect(result.matricula).toBe('2024001');
    });
  });

  describe('buscarAlunoPorMatricula', () => {
    it('deve buscar aluno pela matrícula', async () => {
      mockedApi.get.mockResolvedValue({
        data: { matricula: '001', nomeCompleto: 'João' },
      });

      const result = await buscarAlunoPorMatricula('001');

      expect(mockedApi.get).toHaveBeenCalledWith('/alunos/001');
      expect(result.nomeCompleto).toBe('João');
    });
  });

  describe('excluirAluno', () => {
    it('deve excluir aluno pela matrícula', async () => {
      mockedApi.delete.mockResolvedValue({ data: { success: true } });

      await excluirAluno('2024001');

      expect(mockedApi.delete).toHaveBeenCalledWith('/alunos/excluir/2024001');
    });
  });
});
