import api from './api';
import type { Page } from '../types';

const mapPenalty = (
  penalty?: { code?: string; label?: string } | null,
): string | null => penalty?.code ?? null;

const mapReaderSummary = (item: Record<string, unknown>) => ({
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
  readerCategory: (item.readerCategory as string | undefined) ?? '',
  cursoId: (item.courseId as number | undefined) ?? undefined,
});

const mapReaderDetail = (item: Record<string, unknown>) => ({
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
  readerCategory: (item.readerCategory as string) ?? '',
  penalidade: mapPenalty(
    item.penaltyCode as { code?: string; label?: string } | null,
  ),
  foto: (item.avatarUrl as string) ?? '',
});

const toReaderRequest = (readerData: LeitorPayload) => ({
  registrationNumber: readerData.matricula,
  fullName: readerData.nomeCompleto,
  cpf: readerData.cpf,
  phoneNumber: readerData.celular,
  birthDate: readerData.dataNascimento,
  email: readerData.email,
  courseId: readerData.cursoId,
  studyShiftId: readerData.turnoId,
  academicModuleId: readerData.moduloId,
  readerCategory: readerData.readerCategory,
  postalCode: readerData.cep,
  street: readerData.logradouro,
  district: readerData.bairro,
  city: readerData.localidade,
  stateCode: readerData.uf,
  streetNumber: readerData.numero_casa,
  addressComplement: readerData.complemento,
  penaltyCode: readerData.penalidade,
});

export const getContagemLeitores = async (): Promise<number> => {
  const response = await api.get('/api/readers', {
    params: { page: 0, size: 1 },
  });
  return response.data.totalElements || 0;
};

export interface ListaLeitor {
  penalidade: string | null;
  matricula: string;
  nomeCompleto: string;
  dataNascimento: string;
  email: string;
  celular: string;
  cursoNome: string;
  readerCategory?: string;
  turnoNome?: string;
  moduloNome?: string;
  cursoId?: number;
}

export const buscarLeitoresParaAdmin = async (
  texto?: string,
  page = 0,
  size = 10,
  sort = 'fullName,asc',
): Promise<Page<ListaLeitor>> => {
  const response = await api.get('/api/readers', {
    params: { q: texto, page, size, sort },
  });
  return {
    ...response.data,
    content: (response.data.content || []).map(mapReaderSummary),
  };
};

export interface LeitorPayload {
  matricula: string;
  nomeCompleto: string;
  cpf: string;
  celular?: string;
  dataNascimento?: string;
  email: string;
  cursoId?: number;
  turnoId?: number;
  moduloId?: number;
  readerCategory?: string;
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

export const cadastrarLeitor = async (leitorData: LeitorPayload) => {
  const response = await api.post('/api/readers', toReaderRequest(leitorData));
  return response.data;
};

export interface LeitorFilterParams {
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

export const buscarLeitoresAvancado = async (
  params: LeitorFilterParams,
): Promise<Page<ListaLeitor>> => {
  const response = await api.get('/api/readers/search', {
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
    content: (response.data.content || []).map(mapReaderSummary),
  };
};

export const buscarLeitorPorMatricula = async (matricula: string) => {
  const response = await api.get(`/api/readers/${matricula}`);
  return { ...response, data: mapReaderDetail(response.data) };
};

export const atualizarLeitor = async (
  matricula: string,
  leitorData: LeitorPayload,
) => {
  const response = await api.put(
    `/api/readers/${matricula}`,
    toReaderRequest(leitorData),
  );
  return response.data;
};

export const resetarSenhaLeitor = async (matricula: string) => {
  const response = await api.patch(
    `/api/readers/${matricula}/reset-password`,
  );
  return response.data;
};

export const excluirLeitor = async (matricula: string) => {
  const response = await api.delete(`/api/readers/${matricula}`);
  return response.data;
};
