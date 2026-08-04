import api from './api';

/** Enum localizado devolvido pela API (`{code, label}`). */
export interface LocalizedEnum {
  code: string;
  label: string;
}

export type ContentType = 'ANNOUNCEMENT' | 'ATTACHMENT' | 'WORK';
export type AudienceScope = 'ALL' | 'COURSE' | 'MODULE' | 'SHIFT';

/** Resposta completa do painel admin (`GET /api/contents`). */
export interface ContentResponse {
  id: string;
  contentType: LocalizedEnum;
  title: string;
  body: string | null;
  authors: string | null;
  advisors: string | null;
  completionYear: string | null;
  completionSemester: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
  published: boolean;
  pinned: boolean;
  displayOrder: number;
  audienceScope: LocalizedEnum;
  courseId: number | null;
  courseName: string | null;
  academicModuleId: number | null;
  academicModuleName: string | null;
  studyShiftId: number | null;
  studyShiftName: string | null;
  publishStartAt: string | null;
  publishEndAt: string | null;
  status: LocalizedEnum;
  createdAt: string;
  updatedAt: string;
}

/** Corpo JSON (parte multipart `data`) enviado à API. */
export interface ContentPayload {
  contentType: ContentType;
  title: string;
  body?: string | null;
  authors?: string | null;
  advisors?: string | null;
  completionYear?: string | null;
  completionSemester?: string | null;
  externalUrl?: string | null;
  published: boolean;
  pinned: boolean;
  displayOrder: number;
  audienceScope: AudienceScope;
  courseId?: number | null;
  academicModuleId?: number | null;
  studyShiftId?: number | null;
  publishStartAt?: string | null;
  publishEndAt?: string | null;
}

export interface ContentFilterParams {
  type?: ContentType | '';
  scope?: AudienceScope | '';
  courseId?: string;
  year?: string;
}

const emptyLocalized: LocalizedEnum = { code: '', label: '' };

const toLocalized = (v: unknown): LocalizedEnum => {
  if (v && typeof v === 'object' && 'code' in (v as Record<string, unknown>)) {
    const o = v as Record<string, unknown>;
    return { code: String(o.code ?? ''), label: String(o.label ?? o.code ?? '') };
  }
  if (typeof v === 'string') return { code: v, label: v };
  return emptyLocalized;
};

/** Normaliza a resposta da API para o tipo forte do cliente. */
const toContentResponse = (item: Record<string, unknown>): ContentResponse => ({
  id: String(item.id ?? ''),
  contentType: toLocalized(item.contentType),
  title: (item.title as string) ?? '',
  body: (item.body as string | null) ?? null,
  authors: (item.authors as string | null) ?? null,
  advisors: (item.advisors as string | null) ?? null,
  completionYear: (item.completionYear as string | null) ?? null,
  completionSemester: (item.completionSemester as string | null) ?? null,
  coverUrl: (item.coverUrl as string | null) ?? null,
  fileUrl: (item.fileUrl as string | null) ?? null,
  externalUrl: (item.externalUrl as string | null) ?? null,
  published: Boolean(item.published ?? true),
  pinned: Boolean(item.pinned ?? false),
  displayOrder: Number(item.displayOrder ?? 0),
  audienceScope: toLocalized(item.audienceScope),
  courseId: (item.courseId as number | null) ?? null,
  courseName: (item.courseName as string | null) ?? null,
  academicModuleId: (item.academicModuleId as number | null) ?? null,
  academicModuleName: (item.academicModuleName as string | null) ?? null,
  studyShiftId: (item.studyShiftId as number | null) ?? null,
  studyShiftName: (item.studyShiftName as string | null) ?? null,
  publishStartAt: (item.publishStartAt as string | null) ?? null,
  publishEndAt: (item.publishEndAt as string | null) ?? null,
  status: toLocalized(item.status),
  createdAt: (item.createdAt as string) ?? '',
  updatedAt: (item.updatedAt as string) ?? '',
});

const toFormData = (
  payload: ContentPayload,
  coverFile?: File | null,
  docFile?: File | null,
) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(payload));
  if (coverFile) formData.append('coverFile', coverFile);
  if (docFile) formData.append('docFile', docFile);
  return formData;
};

export const listarConteudos = async (
  texto?: string,
  type?: ContentType | '',
): Promise<ContentResponse[]> => {
  const response = await api.get('/api/contents', {
    params: { q: texto || undefined, type: type || undefined },
  });
  return (response.data || []).map(toContentResponse);
};

export const buscarConteudoPorId = async (
  id: string,
): Promise<ContentResponse> => {
  const response = await api.get(`/api/contents/${id}`);
  return toContentResponse(response.data);
};

export const listarConteudosAvancado = async (
  params: ContentFilterParams,
): Promise<ContentResponse[]> => {
  const response = await api.get('/api/contents/search', {
    params: {
      type: params.type || undefined,
      scope: params.scope || undefined,
      courseId: params.courseId || undefined,
      year: params.year || undefined,
    },
  });
  return (response.data || []).map(toContentResponse);
};

export const cadastrarConteudo = async (
  payload: ContentPayload,
  coverFile?: File | null,
  docFile?: File | null,
) => {
  const response = await api.post(
    '/api/contents',
    toFormData(payload, coverFile, docFile),
  );
  return toContentResponse(response.data);
};

export const atualizarConteudo = async (
  id: string,
  payload: ContentPayload,
  coverFile?: File | null,
  docFile?: File | null,
) => {
  const response = await api.put(
    `/api/contents/${id}`,
    toFormData(payload, coverFile, docFile),
  );
  return toContentResponse(response.data);
};

export const excluirConteudo = async (id: string) => {
  const response = await api.delete(`/api/contents/${id}`);
  return response.data;
};
