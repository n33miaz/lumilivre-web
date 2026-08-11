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
  getEmprestimoStatusSummary,
  buscarEmprestimosAtivosEAtrasados,
  buscarRanking,
  buscarHistoricoLeitor,
  buscarEmprestimosAtivosLeitor,
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
      leitor_matricula: '12345',
      exemplar_tombo: '001',
      data_emprestimo: '2026-03-11',
      data_devolucao: '2026-03-18',
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/api/loans', {
      readerRegistrationNumber: '12345',
      copyCode: '001',
      borrowedAt: '2026-03-11T12:00:00-03:00',
      dueAt: '2026-03-18T12:00:00-03:00',
    });
  });

  it('atualizarEmprestimo uses PUT /api/loans/{id}', async () => {
    mockedApi.put.mockResolvedValue({ data: { id: 'loan-1' } });

    await atualizarEmprestimo('loan-1', {
      leitor_matricula: '12345',
      exemplar_tombo: '001',
      data_emprestimo: '2026-03-11',
      data_devolucao: '2026-03-25',
    });

    expect(mockedApi.put).toHaveBeenCalledWith('/api/loans/loan-1', {
      readerRegistrationNumber: '12345',
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

    expect(mockedApi.put).toHaveBeenCalledWith('/api/loans/loan-99/close');
    expect(mockedApi.delete).toHaveBeenCalledWith('/api/loans/loan-42');
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
            readerName: 'Joao',
            readerRegistrationNumber: '2024001',
          },
        ],
      },
    });

    const result = await buscarEmprestimosPaginado('', 0, 10, 'borrowedAt,desc');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/loans', {
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

    expect(mockedApi.get).toHaveBeenCalledWith('/api/loans/advanced', {
      params: expect.objectContaining({ status: 'OVERDUE' }),
    });
  });

  it('count helpers use v2 endpoints', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: [{ id: '1' }, { id: '2' }], status: 200 })
      .mockResolvedValueOnce({ data: 15 });

    await expect(getContagemAtrasados()).resolves.toBe(2);
    await expect(getContagemEmprestimosTotais()).resolves.toBe(15);

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/api/loans/overdue');
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      '/api/loans/active-and-overdue/count',
    );
  });

  it('getEmprestimoStatusSummary reads the global status-summary endpoint', async () => {
    mockedApi.get.mockResolvedValue({
      data: { all: 164, active: 40, overdue: 8, dueToday: 7, completed: 109 },
    });

    const result = await getEmprestimoStatusSummary();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/loans/status-summary');
    expect(result).toEqual({
      all: 164,
      active: 40,
      overdue: 8,
      dueToday: 7,
      completed: 109,
    });
  });

  it('getEmprestimoStatusSummary defaults missing counters to zero', async () => {
    mockedApi.get.mockResolvedValue({ data: {} });

    await expect(getEmprestimoStatusSummary()).resolves.toEqual({
      all: 0,
      active: 0,
      overdue: 0,
      dueToday: 0,
      completed: 0,
    });
  });

  it('buscarEmprestimosAtivosEAtrasados maps v2 active loans', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        {
          id: 'loan-1',
          status: { code: 'OVERDUE' },
          bookTitle: 'Livro A',
          readerName: 'Joao',
          readerRegistrationNumber: '2024001',
          copyCode: 'T001',
        },
      ],
    });

    const result = await buscarEmprestimosAtivosEAtrasados();

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/loans/active-and-overdue',
    );
    expect(result[0].statusEmprestimo).toBe('ATRASADO');
  });

  it('buscarRanking uses v2 reader ranking filters', async () => {
    mockedApi.get.mockResolvedValue({
      data: [{ registrationNumber: '001', fullName: 'Joao', emprestimosCount: 10 }],
    });

    const result = await buscarRanking(5, 1, 2, 3);

    expect(mockedApi.get).toHaveBeenCalledWith('/api/readers/ranking', {
      params: { top: 5, courseId: 1, academicModuleId: 2, studyShiftId: 3 },
    });
    expect(result[0].nome).toBe('Joao');
  });

  it('reader loan history routes use v2', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: [{ id: 'history-1' }] })
      .mockResolvedValueOnce({ data: [{ id: 'active-1' }] });

    await buscarHistoricoLeitor('2024001');
    await buscarEmprestimosAtivosLeitor('2024001');

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      '/api/loans/reader/2024001/history',
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      '/api/loans/reader/2024001',
    );
  });
});
