import api from './api';

import type { Page } from '../types';

type LocalizedEnum = {
  code?: string;
  label?: string;
};

type RawPage = Partial<Page<Record<string, unknown>>> & {
  content?: Record<string, unknown>[];
};

export interface ListaLivro {
  status: string;
  tomboExemplar: string;
  isbn: string;
  cdd: string;
  nome: string;
  genero: string;
  autor: string;
  editora: string;
  localizacao_fisica: string;
  responsavel?: string;
}

export interface LivroAgrupado {
  id: string;
  isbn: string;
  nome: string;
  autor: string;
  editora: string;
  quantidade: number;
  imagem?: string;
}

export interface LivroFilterParams {
  nome?: string;
  isbn?: string;
  autor?: string;
  genero?: string;
  editora?: string;
  cdd?: string;
  classificacaoEtaria?: string;
  tipoCapa?: string;
  dataLancamento?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface LivroPayload {
  isbn: string;
  nome: string;
  data_lancamento: string;
  numero_paginas: number;
  cdd: string;
  editora: string;
  classificacao_etaria: string;
  edicao?: string;
  volume?: number;
  sinopse?: string;
  tipo_capa: string;
  generos: string[];
  autor: string;
  imagem?: string;
}

export interface CddItem {
  id: string;
  nome: string;
}

export interface LivroDetalhado extends Omit<LivroPayload, 'generos'> {
  id?: string;
  generos: string[];
  cddCodigo?: string;
  tipoCapaRaw?: string;
  classificacaoEtariaRaw?: string;
  avaliacao?: number;
}

const bookSortMap: Record<string, string> = {
  id: 'id',
  isbn: 'isbn',
  nome: 'title',
  autor: 'author',
  editora: 'publisher',
  quantidade: 'title',
};

const copyStatusToPt = (status?: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'DISPONIVEL';
    case 'BORROWED':
      return 'EMPRESTADO';
    case 'UNAVAILABLE':
      return 'INDISPONIVEL';
    case 'MAINTENANCE':
      return 'MANUTENCAO';
    default:
      return status || '';
  }
};

const enumCode = (value: unknown) =>
  typeof value === 'object' && value !== null
    ? ((value as LocalizedEnum).code ?? '')
    : String(value ?? '');

const enumLabel = (value: unknown) =>
  typeof value === 'object' && value !== null
    ? ((value as LocalizedEnum).label ?? (value as LocalizedEnum).code ?? '')
    : String(value ?? '');

const normalizeSort = (sort?: string) => {
  if (!sort) return undefined;

  return sort
    .split(';')
    .map((part) => {
      const [field, direction = 'asc'] = part.split(',');
      return `${bookSortMap[field] ?? field},${direction}`;
    })
    .join(';');
};

const mapPage = <T>(
  data: RawPage | undefined,
  mapper: (item: Record<string, unknown>) => T,
): Page<T> => ({
  content: (data?.content || []).map(mapper),
  totalPages: data?.totalPages ?? 0,
  totalElements: data?.totalElements ?? 0,
  number: data?.number ?? 0,
  size: data?.size ?? 0,
  first: data?.first ?? true,
  last: data?.last ?? true,
  empty: data?.empty ?? !(data?.content?.length),
});

const toListaLivro = (item: Record<string, unknown>): ListaLivro => ({
  status: copyStatusToPt(enumCode(item.copyStatus)),
  tomboExemplar: (item.copyCode as string) ?? '',
  isbn: (item.isbn as string) ?? '',
  cdd: (item.deweyCode as string) ?? '',
  nome: (item.title as string) ?? '',
  genero: (item.genre as string) ?? '',
  autor: (item.author as string) ?? '',
  editora: (item.publisher as string) ?? '',
  localizacao_fisica: (item.physicalLocation as string) ?? '',
});

const toLivroAgrupado = (item: Record<string, unknown>): LivroAgrupado => ({
  id: String(item.id ?? ''),
  isbn: (item.isbn as string) ?? '',
  nome: (item.title as string) ?? '',
  autor: (item.author as string) ?? '',
  editora: (item.publisher as string) ?? '',
  quantidade: Number(item.copyCount ?? 0),
  imagem: (item.coverUrl as string) ?? '',
});

const toLivroDetalhado = (item: Record<string, unknown>): LivroDetalhado => {
  const ageRating = item.ageRating;
  const coverType = item.coverType;
  const deweyCode = (item.deweyCode as string) ?? '';

  return {
    id: String(item.id ?? ''),
    isbn: (item.isbn as string) ?? '',
    nome: (item.title as string) ?? '',
    autor: (item.author as string) ?? '',
    editora: (item.publisher as string) ?? '',
    data_lancamento: (item.publicationDate as string) ?? '',
    numero_paginas: Number(item.pageCount ?? 0),
    cdd: deweyCode,
    cddCodigo: deweyCode.split(' - ')[0] || deweyCode,
    classificacao_etaria: enumLabel(ageRating),
    classificacaoEtariaRaw: enumCode(ageRating),
    edicao: (item.edition as string) ?? '',
    volume: item.volume ? Number(item.volume) : undefined,
    sinopse: (item.synopsis as string) ?? '',
    tipo_capa: enumLabel(coverType),
    tipoCapaRaw: enumCode(coverType),
    generos: Array.isArray(item.genres) ? (item.genres as string[]) : [],
    imagem: (item.coverUrl as string) ?? '',
    avaliacao: item.rating ? Number(item.rating) : undefined,
  };
};

const toBookRequest = (livroData: LivroPayload) => ({
  isbn: livroData.isbn,
  title: livroData.nome,
  author: livroData.autor,
  publisher: livroData.editora,
  publicationDate: livroData.data_lancamento || undefined,
  pageCount: livroData.numero_paginas,
  deweyCode: livroData.cdd || undefined,
  ageRating: livroData.classificacao_etaria,
  edition: livroData.edicao || undefined,
  volume: livroData.volume || undefined,
  synopsis: livroData.sinopse || undefined,
  coverType: livroData.tipo_capa,
  coverUrl: livroData.imagem || undefined,
  genres: livroData.generos,
});

export const getContagemLivros = async (): Promise<number> => {
  const response = await api.get('/api/books/grouped', {
    params: { page: 0, size: 1 },
  });
  return response.data?.totalElements || 0;
};

export const buscarLivrosParaAdmin = async (
  texto?: string,
  page = 0,
  size = 10,
  sort = 'nome,asc',
): Promise<Page<ListaLivro>> => {
  const response = await api.get('/api/books/search', {
    params: {
      q: texto || undefined,
      page,
      size,
      sort: normalizeSort(sort),
    },
  });
  return mapPage(response.data, toListaLivro);
};

export const buscarLivrosAgrupados = async (
  texto?: string,
  page = 0,
  size = 10,
  sort = 'nome,asc',
): Promise<Page<LivroAgrupado>> => {
  const response = await api.get('/api/books/grouped', {
    params: {
      q: texto || undefined,
      page,
      size,
      sort: normalizeSort(sort),
    },
  });
  return mapPage(response.data, toLivroAgrupado);
};

export const buscarLivrosAvancado = async (
  params: LivroFilterParams,
): Promise<Page<LivroAgrupado>> => {
  const response = await api.get('/api/books/advanced', {
    params: {
      title: params.nome,
      isbn: params.isbn,
      author: params.autor,
      genre: params.genero,
      publisher: params.editora,
      deweyCode: params.cdd,
      ageRating: params.classificacaoEtaria,
      coverType: params.tipoCapa,
      publicationDate: params.dataLancamento,
      page: params.page,
      size: params.size,
      sort: normalizeSort(params.sort),
    },
  });
  return mapPage(response.data, toLivroAgrupado);
};

export const cadastrarLivro = async (
  livroData: LivroPayload,
  file?: File | null,
) => {
  const response = await api.post('/api/books', toBookRequest(livroData));

  if (file && response.data?.id) {
    const coverResponse = await uploadCapaLivro(response.data.id, file);
    return toLivroAgrupado(coverResponse);
  }

  return toLivroAgrupado(response.data);
};

export const atualizarLivro = async (
  id: number | string,
  livroData: LivroPayload,
  file?: File | null,
) => {
  const response = await api.put(`/api/books/${id}`, toBookRequest(livroData));

  if (file) {
    const coverResponse = await uploadCapaLivro(id, file);
    return toLivroDetalhado(coverResponse);
  }

  return toLivroDetalhado(response.data);
};

export const uploadCapaLivro = async (id: number | string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/api/books/${id}/cover`, formData);
  return response.data;
};

export const buscarEnum = async (
  tipo: string,
): Promise<{ nome: string; status: string }[]> => {
  const response = await api.get(`/api/metadata/enums/${tipo}`);
  return (response.data || []).map((item: Record<string, unknown>) => ({
    nome: (item.code as string) ?? '',
    status: (item.label as string) ?? '',
  }));
};

export const excluirLivroComExemplares = async (id: number | string) => {
  const response = await api.delete(`/api/books/${id}`);
  return response.data;
};

export const buscarLivroPorId = async (id: number | string) => {
  const response = await api.get(`/api/books/${id}`);
  return {
    ...response,
    data: toLivroDetalhado(response.data),
  };
};

export const buscarCdds = async (): Promise<CddItem[]> => {
  const response = await api.get('/api/dewey-classifications');
  return (response.data || []).map((item: Record<string, unknown>) => ({
    id: item.code as string,
    nome: item.description as string,
  }));
};
