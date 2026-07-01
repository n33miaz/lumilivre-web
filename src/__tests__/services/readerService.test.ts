import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buscarAlunosParaAdmin,
  cadastrarAluno,
  excluirAluno,
  buscarAlunoPorMatricula,
  type AlunoPayload,
} from '../../services/studentService';
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

describe('studentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buscarAlunosParaAdmin uses v2 and maps student summaries', async () => {
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

    const result = await buscarAlunosParaAdmin();

    expect(mockedApi.get).toHaveBeenCalledWith('/api/students', {
      params: { q: undefined, page: 0, size: 10, sort: 'fullName,asc' },
    });
    expect(result.content[0].matricula).toBe('001');
    expect(result.content[0].nomeCompleto).toBe('Joao');
  });

  it('cadastrarAluno sends the v2 payload', async () => {
    const alunoData: AlunoPayload = {
      matricula: '2024001',
      nomeCompleto: 'Novo Aluno',
      cpf: '12345678900',
      email: 'aluno@email.com',
      cursoId: 1,
      turnoId: 2,
      moduloId: 3,
    };
    mockedApi.post.mockResolvedValue({ data: { registrationNumber: '2024001' } });

    await cadastrarAluno(alunoData);

    expect(mockedApi.post).toHaveBeenCalledWith('/api/students', {
      registrationNumber: '2024001',
      fullName: 'Novo Aluno',
      cpf: '12345678900',
      phoneNumber: undefined,
      birthDate: undefined,
      email: 'aluno@email.com',
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

  it('buscarAlunoPorMatricula maps v2 detail into the legacy UI shape', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        registrationNumber: '001',
        fullName: 'Joao',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });

    const result = await buscarAlunoPorMatricula('001');

    expect(mockedApi.get).toHaveBeenCalledWith('/api/students/001');
    expect(result.data.nomeCompleto).toBe('Joao');
    expect(result.data.foto).toBe('https://example.com/avatar.png');
  });

  it('excluirAluno deletes by registration number in v2', async () => {
    mockedApi.delete.mockResolvedValue({ data: undefined });

    await excluirAluno('2024001');

    expect(mockedApi.delete).toHaveBeenCalledWith('/api/students/2024001');
  });
});
