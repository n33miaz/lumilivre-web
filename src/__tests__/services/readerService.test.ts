import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarLeitoresParaAdmin,
  cadastrarLeitor,
  excluirLeitor,
  buscarLeitorPorMatricula,
  getLeitorPenaltySummary,
  type LeitorPayload,
} from '../../services/readerService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('readerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buscarLeitoresParaAdmin uses v2 and maps reader summaries', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        content: [
          {
            registrationNumber: '001',
            fullName: 'Joao',
            penaltyCode: { code: 'NONE', label: 'Sem penalidade' },
          },
        ],
        totalElements: 1,
        totalPages: 1,
      },
    });

    const result = await buscarLeitoresParaAdmin();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/readers', {
      params: { q: undefined, page: 0, size: 10, sort: 'fullName,asc' },
    });
    expect(result.content[0].matricula).toBe('001');
    expect(result.content[0].nomeCompleto).toBe('Joao');
  });

  it('getLeitorPenaltySummary reads the global penalty-summary endpoint', async () => {
    mockedApi.get.mockResolvedValue({
      data: { noPenalty: 120, warning: 8, suspension: 3, block: 2 },
    });

    const result = await getLeitorPenaltySummary();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/readers/penalty-summary');
    expect(result).toEqual({
      noPenalty: 120,
      warning: 8,
      suspension: 3,
      block: 2,
    });
  });

  it('cadastrarLeitor sends the v2 payload', async () => {
    const leitorData: LeitorPayload = {
      matricula: '2024001',
      nomeCompleto: 'Novo Leitor',
      cpf: '12345678900',
      email: 'leitor@email.com',
      cursoId: 1,
      turnoId: 2,
      moduloId: 3,
    };
    mockedApi.post.mockResolvedValue({ data: { registrationNumber: '2024001' } });

    await cadastrarLeitor(leitorData);

    expect(mockedApi.post).toHaveBeenCalledWith('/api/readers', {
      registrationNumber: '2024001',
      fullName: 'Novo Leitor',
      cpf: '12345678900',
      phoneNumber: undefined,
      birthDate: undefined,
      email: 'leitor@email.com',
      courseId: 1,
      studyShiftId: 2,
      academicModuleId: 3,
      postalCode: undefined,
      street: undefined,
      district: undefined,
      city: undefined,
      stateCode: undefined,
      streetNumber: undefined,
      addressComplement: undefined,
      penaltyCode: undefined,
    });
  });

  it('buscarLeitorPorMatricula maps v2 detail into the legacy UI shape', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        registrationNumber: '001',
        fullName: 'Joao',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    const result = await buscarLeitorPorMatricula('001');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/readers/001');
    expect(result.data.nomeCompleto).toBe('Joao');
    expect(result.data.foto).toBe('https://example.com/avatar.png');
  });

  it('excluirLeitor deletes by registration number in v2', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await excluirLeitor('2024001');

    expect(mockedApi.delete).toHaveBeenCalledWith('/api/readers/2024001');
  });
});
