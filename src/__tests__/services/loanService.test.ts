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
} from '../../services/loanService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('loanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cadastrarEmprestimo sends the v2 loan payload', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'loan-1' } });

    await cadastrarEmprestimo({
      aluno_matricula: '12345',
      exemplar_tombo: '001',
      data_emprestimo: '2026-03-11',
      data_devolucao: '2026-03-18',
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/api/v2/loans', {
      studentRegistrationNumber: '12345',
      copyCode: '001',
      borrowedAt: '2026-03-11T12:00:00-03:00',
      dueAt: '2026-03-18T12:00:00-03:00',
    });
  });

  it('atualizarEmprestimo uses PUT /api/v2/loans/{id}', async () => {
    mockedApi.put.mockResolvedValue({ data: { id: 'loan-1' } });

    await atualizarEmprestimo('loan-1', {
      aluno_matricula: '12345',
      exemplar_tombo: '001',
      data_emprestimo: '2026-03-11',
      data_devolucao: '2026-03-25',
    });

    expect(mockedApi.put).toHaveBeenCalledWith('/api/v2/loans/loan-1', {
      studentRegistrationNumber: '12345',
      copyCode: '001',
      borrowedAt: '2026-03-11T12:00:00-03:00',
      dueAt: '2026-03-25T12:00:00-03:00',
    });
  });

  it('concluirEmprestimo and excluirEmprestimo use v2 routes', async () => {
    mockedApi.put.mockResolvedValue({ data: {} });
    mockedApi.delete.mockResolvedValue({ data: {} });

    await concluirEmprestimo('loan-99');
    await excluirEmprestimo('loan-42');

    expect(mockedApi.put).toHaveBeenCalledWith('/api/v2/loans/loan-99/close');
    expect(mockedApi.delete).toHaveBeenCalledWith('/api/v2/loans/loan-42');
  });

  it('buscarEmprestimosPaginado maps v2 list rows', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        content: [
          {
            id: 'loan-1',
            status: { code: 'ACTIVE' },
            bookTitle: 'Livro A',
            copyCode: 'T001',
            studentName: 'Joao',
            studentRegistrationNumber: '2024001',
          },
        ],
      },
    });

    const result = await buscarEmprestimosPaginado('', 0, 10, 'borrowedAt,desc');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/loans', {
      params: { q: undefined, page: 0, size: 10, sort: 'borrowedAt,desc' },
    });
    expect(result.content[0].statusEmprestimo).toBe('ATIVO');
  });

  it('buscarEmprestimosAvancado translates PT status to v2 status', async () => {
    mockedApi.get.mockResolvedValue({ data: { content: [] } });

    await buscarEmprestimosAvancado({
      statusEmprestimo: 'ATRASADO',
      page: 0,
      size: 10,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/loans/advanced', {
      params: expect.objectContaining({ status: 'OVERDUE' }),
    });
  });

  it('count helpers use v2 endpoints', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: [{ id: '1' }, { id: '2' }], status: 200 })
      .mockResolvedValueOnce({ data: 15 });

    await expect(getContagemAtrasados()).resolves.toBe(2);
    await expect(getContagemEmprestimosTotais()).resolves.toBe(15);

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/api/v2/loans/overdue');
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      '/api/v2/loans/active-and-overdue/count',
    );
  });

  it('buscarEmprestimosAtivosEAtrasados maps v2 active loans', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        {
          id: 'loan-1',
          status: { code: 'OVERDUE' },
          bookTitle: 'Livro A',
          studentName: 'Joao',
          studentRegistrationNumber: '2024001',
          copyCode: 'T001',
        },
      ],
    });

    const result = await buscarEmprestimosAtivosEAtrasados();

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/v2/loans/active-and-overdue',
    );
    expect(result[0].statusEmprestimo).toBe('ATRASADO');
  });

  it('buscarRanking uses v2 student ranking filters', async () => {
    mockedApi.get.mockResolvedValue({
      data: [{ registrationNumber: '001', fullName: 'Joao', emprestimosCount: 10 }],
    });

    const result = await buscarRanking(5, 1, 2, 3);

    expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/students/ranking', {
      params: { top: 5, courseId: 1, academicModuleId: 2, studyShiftId: 3 },
    });
    expect(result[0].nome).toBe('Joao');
  });

  it('student loan history routes use v2', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: [{ id: 'history-1' }] })
      .mockResolvedValueOnce({ data: [{ id: 'active-1' }] });

    await buscarHistoricoAluno('2024001');
    await buscarEmprestimosAtivosAluno('2024001');

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      '/api/v2/loans/student/2024001/history',
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      '/api/v2/loans/student/2024001',
    );
  });
});
