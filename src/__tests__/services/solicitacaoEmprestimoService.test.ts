import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarSolicitacoesPendentes,
  processarSolicitacao,
} from '../../services/loanRequestService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('loanRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buscarSolicitacoesPendentes uses v2 and maps fields', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        {
          id: 'req-1',
          studentName: 'Joao',
          studentRegistrationNumber: '2024001',
          bookTitle: 'Dom Casmurro',
          copyCode: 'T001',
          requestedAt: '2026-03-10T10:00:00Z',
        },
      ],
    });

    const result = await buscarSolicitacoesPendentes();

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/v2/loan-requests/pending',
    );
    expect(result[0].alunoNome).toBe('Joao');
    expect(result[0].livroNome).toBe('Dom Casmurro');
  });

  it('buscarSolicitacoesPendentes returns [] on null response or errors', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: null });
    await expect(buscarSolicitacoesPendentes()).resolves.toEqual([]);

    mockedApi.get.mockRejectedValueOnce(new Error('Erro de rede'));
    await expect(buscarSolicitacoesPendentes()).resolves.toEqual([]);
  });

  it('processarSolicitacao uses v2 process endpoint', async () => {
    mockedApi.post.mockResolvedValue({ data: { success: true } });

    await processarSolicitacao('req-1', true);

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/api/v2/loan-requests/req-1/process',
      null,
      { params: { accept: true } },
    );
  });
});
