import api from './api';
import type { ListaLivro } from './bookService';

export interface ExemplarPayload {
  tombo: string;
  livro_id: string;
  status_livro: 'DISPONIVEL';
  localizacao_fisica: string;
}

export interface ExemplarUpdatePayload {
  tombo: string;
  localizacao_fisica: string;
  livro_id: string;
  status_livro: string;
}

const statusMap: Record<string, string> = {
  DISPONIVEL: 'AVAILABLE',
  EMPRESTADO: 'BORROWED',
  INDISPONIVEL: 'UNAVAILABLE',
  MANUTENCAO: 'MAINTENANCE',
};

const reverseStatusMap: Record<string, string> = {
  AVAILABLE: 'DISPONIVEL',
  BORROWED: 'EMPRESTADO',
  UNAVAILABLE: 'INDISPONIVEL',
  MAINTENANCE: 'MANUTENCAO',
};

export const buscarExemplaresPorLivroId = async (
  livroId: number | string,
): Promise<ListaLivro[]> => {
  const response = await api.get(`/api/book-copies/by-book/${livroId}`);
  return (response.data || []).map((item: Record<string, unknown>) => ({
    status:
      reverseStatusMap[(item.status as Record<string, string>)?.code] ??
      ((item.status as Record<string, string>)?.code || ''),
    tomboExemplar: item.copyCode as string,
    isbn: item.isbn as string,
    cdd: item.deweyCode as string,
    nome: item.title as string,
    genero: (item.genres as string[])?.join(', ') ?? '',
    autor: item.author as string,
    editora: item.publisher as string,
    localizacao_fisica: item.shelfLocation as string,
  }));
};

export const cadastrarExemplar = async (payload: ExemplarPayload) => {
  const response = await api.post('/api/book-copies', {
    copyCode: payload.tombo,
    bookId: payload.livro_id,
    status: statusMap[payload.status_livro] ?? payload.status_livro,
    shelfLocation: payload.localizacao_fisica,
  });
  return response.data;
};

export const atualizarExemplar = async (
  tomboAtual: string,
  payload: ExemplarUpdatePayload,
) => {
  const response = await api.put(`/api/book-copies/${tomboAtual}`, {
    copyCode: payload.tombo,
    bookId: payload.livro_id,
    status: statusMap[payload.status_livro] ?? payload.status_livro,
    shelfLocation: payload.localizacao_fisica,
  });
  return response.data;
};

export const excluirExemplar = async (tombo: string) => {
  const response = await api.delete(`/api/book-copies/${tombo}`);
  return response.data;
};
