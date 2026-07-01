import api from './api';
import type { Page } from '../types';

const mapPenalty = (
  penalty?: { code?: string; label?: string } | null,
): string | null => penalty?.code ?? null;

const mapStudentSummary = (item: Record<string, unknown>) => ({
  penalidade: mapPenalty(
    item.penaltyCode as { code?: string; label?: string } | null,
  ),
  matricula: item.registrationNumber as string,
  nomeCompleto: item.fullName as string,
  dataNascimento: item.birthDate as string,
  email: (item.email as string) ?? '',
  celular: (item.phoneNumber as string) ?? '',
  cursoNome: (item.courseName as string) ?? '',
  turnoNome: (item.studyShiftName as string | undefined) ?? undefined,
  moduloNome: (item.academicModuleName as string | undefined) ?? undefined,
  cursoId: (item.courseId as number | undefined) ?? undefined,
});

const mapStudentDetail = (item: Record<string, unknown>) => ({
  matricula: item.registrationNumber as string,
  nomeCompleto: item.fullName as string,
  cpf: (item.cpf as string) ?? '',
  celular: (item.phoneNumber as string) ?? '',
  dataNascimento: (item.birthDate as string) ?? '',
  email: (item.email as string) ?? '',
  cursoId: (item.courseId as number | undefined) ?? 0,
  turnoId: (item.studyShiftId as number | undefined) ?? 0,
  moduloId: (item.academicModuleId as number | undefined) ?? 0,
  cep: (item.postalCode as string) ?? '',
  logradouro: (item.street as string) ?? '',
  bairro: (item.district as string) ?? '',
  localidade: (item.city as string) ?? '',
  uf: (item.stateCode as string) ?? '',
  numero_casa: (item.streetNumber as number | undefined) ?? undefined,
  complemento: (item.addressComplement as string) ?? '',
  cursoNome: (item.courseName as string) ?? '',
  turnoNome: (item.studyShiftName as string) ?? '',
  moduloNome: (item.academicModuleName as string) ?? '',
  penalidade: mapPenalty(
    item.penaltyCode as { code?: string; label?: string } | null,
  ),
  foto: (item.avatarUrl as string) ?? '',
});

const toStudentRequest = (studentData: AlunoPayload) => ({
  registrationNumber: studentData.matricula,
  fullName: studentData.nomeCompleto,
  cpf: studentData.cpf,
  phoneNumber: studentData.celular,
  birthDate: studentData.dataNascimento,
  email: studentData.email,
  courseId: studentData.cursoId,
  studyShiftId: studentData.turnoId,
  academicModuleId: studentData.moduloId,
  postalCode: studentData.cep,
  street: studentData.logradouro,
  district: studentData.bairro,
  city: studentData.localidade,
  stateCode: studentData.uf,
  streetNumber: studentData.numero_casa,
  addressComplement: studentData.complemento,
  penaltyCode: studentData.penalidade,
});

export const getContagemAlunos = async (): Promise<number> => {
  const response = await api.get('/api/students', {
    params: { page: 0, size: 1 },
  });
  return response.data.totalElements || 0;
};

export interface ListaAluno {
  penalidade: string | null;
  matricula: string;
  nomeCompleto: string;
  dataNascimento: string;
  email: string;
  celular: string;
  cursoNome: string;
  turnoNome?: string;
  moduloNome?: string;
  cursoId?: number;
}

export const buscarAlunosParaAdmin = async (
  texto?: string,
  page = 0,
  size = 10,
  sort = 'fullName,asc',
): Promise<Page<ListaAluno>> => {
  const response = await api.get('/api/students', {
    params: { q: texto, page, size, sort },
  });
  return {
    ...response.data,
    content: (response.data.content || []).map(mapStudentSummary),
  };
};

export interface AlunoPayload {
  matricula: string;
  nomeCompleto: string;
  cpf: string;
  celular?: string;
  dataNascimento?: string;
  email: string;
  cursoId: number;
  turnoId: number;
  moduloId: number;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  numero_casa?: number;
  complemento?: string;
  turno?: string;
  modulo?: string;
  penalidade?: string;
}

export const cadastrarAluno = async (alunoData: AlunoPayload) => {
  const response = await api.post('/api/students', toStudentRequest(alunoData));
  return response.data;
};

export interface AlunoFilterParams {
  penalidade?: string;
  matricula?: string;
  nome?: string;
  cursoNome?: string;
  turnoId?: number;
  moduloId?: number;
  dataNascimento?: string;
  email?: string;
  celular?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const buscarAlunosAvancado = async (
  params: AlunoFilterParams,
): Promise<Page<ListaAluno>> => {
  const response = await api.get('/api/students/search', {
    params: {
      penalty: params.penalidade,
      registrationNumber: params.matricula,
      name: params.nome,
      courseName: params.cursoNome,
      studyShiftId: params.turnoId,
      academicModuleId: params.moduloId,
      page: params.page,
      size: params.size,
      sort: params.sort,
    },
  });
  return {
    ...response.data,
    content: (response.data.content || []).map(mapStudentSummary),
  };
};

export const buscarAlunoPorMatricula = async (matricula: string) => {
  const response = await api.get(`/api/students/${matricula}`);
  return { ...response, data: mapStudentDetail(response.data) };
};

export const atualizarAluno = async (
  matricula: string,
  alunoData: AlunoPayload,
) => {
  const response = await api.put(
    `/api/students/${matricula}`,
    toStudentRequest(alunoData),
  );
  return response.data;
};

export const resetarSenhaAluno = async (matricula: string) => {
  const response = await api.patch(
    `/api/students/${matricula}/reset-password`,
  );
  return response.data;
};

export const excluirAluno = async (matricula: string) => {
  const response = await api.delete(`/api/students/${matricula}`);
  return response.data;
};
