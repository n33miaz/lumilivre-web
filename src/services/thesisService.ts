import api from './api';

export interface TccResponse {
  id: string;
  titulo: string;
  alunos: string;
  orientadores: string;
  curso: string;
  anoConclusao: string;
  semestreConclusao: string;
  arquivoPdf: string | null;
  foto: string | null;
  linkExterno: string | null;
  ativo: boolean;
}

export interface TccPayload {
  titulo: string;
  alunos: string;
  orientadores: string;
  curso_id: number;
  anoConclusao: string;
  semestreConclusao: string;
  linkExterno: string;
  ativo: boolean;
}

export interface TccFilterParams {
  cursoId?: string;
  semestre?: string;
  ano?: string;
}

const toTccResponse = (item: Record<string, unknown>): TccResponse => ({
  id: String(item.id ?? ''),
  titulo: (item.title as string) ?? '',
  alunos: (item.authors as string) ?? '',
  orientadores: (item.advisors as string) ?? '',
  curso: (item.courseName as string) ?? '',
  anoConclusao: (item.completionYear as string) ?? '',
  semestreConclusao: (item.completionSemester as string) ?? '',
  arquivoPdf: (item.pdfUrl as string | null) ?? null,
  foto: (item.coverUrl as string | null) ?? null,
  linkExterno: (item.externalUrl as string | null) ?? null,
  ativo: Boolean(item.active ?? true),
});

const toThesisRequest = (tccData: TccPayload) => ({
  title: tccData.titulo,
  authors: tccData.alunos,
  advisors: tccData.orientadores,
  courseId: tccData.curso_id,
  completionYear: tccData.anoConclusao,
  completionSemester: tccData.semestreConclusao,
  externalUrl: tccData.linkExterno,
  active: tccData.ativo,
});

const toFormData = (
  tccData: TccPayload,
  filePdf?: File | null,
  fileFoto?: File | null,
) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(toThesisRequest(tccData)));

  if (filePdf) formData.append('pdfFile', filePdf);
  if (fileFoto) formData.append('coverFile', fileFoto);

  return formData;
};

export const listarTccs = async (texto?: string): Promise<TccResponse[]> => {
  const response = await api.get('/api/v2/theses', {
    params: { q: texto || undefined },
  });
  return (response.data || []).map(toTccResponse);
};

export const buscarTccPorId = async (
  id: number | string,
): Promise<TccResponse> => {
  const response = await api.get(`/api/v2/theses/${id}`);
  return toTccResponse(response.data);
};

export const listarTccsAvancado = async (
  params: TccFilterParams,
): Promise<TccResponse[]> => {
  const response = await api.get('/api/v2/theses/search', {
    params: {
      courseId: params.cursoId,
      semester: params.semestre,
      year: params.ano,
    },
  });
  return (response.data || []).map(toTccResponse);
};

export const cadastrarTcc = async (
  tccData: TccPayload,
  filePdf?: File | null,
  fileFoto?: File | null,
) => {
  const response = await api.post(
    '/api/v2/theses',
    toFormData(tccData, filePdf, fileFoto),
  );
  return toTccResponse(response.data);
};

export const atualizarTcc = async (
  id: number | string,
  tccData: TccPayload,
  filePdf?: File | null,
  fileFoto?: File | null,
) => {
  const response = await api.put(
    `/api/v2/theses/${id}`,
    toFormData(tccData, filePdf, fileFoto),
  );
  return toTccResponse(response.data);
};

export const excluirTcc = async (id: number | string) => {
  const response = await api.delete(`/api/v2/theses/${id}`);
  return response.data;
};
