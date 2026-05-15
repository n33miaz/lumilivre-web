import api from './api';

export interface LivroGoogle {
  nome: string;
  autor: string;
  editora: string;
  data_lancamento: string;
  numero_paginas: number;
  generos: string[];
  sinopse: string;
  imagem: string;
}

export const buscarLivroPorIsbn = async (isbn: string) => {
  try {
    const response = await api.get(`/api/v2/books/isbn/${isbn}`);

    return {
      nome: response.data.title,
      autor: response.data.author,
      editora: response.data.publisher,
      data_lancamento: response.data.publicationDate,
      numero_paginas: response.data.pageCount,
      generos: response.data.genres ?? [],
      sinopse: response.data.synopsis,
      imagem: response.data.coverUrl,
    };
  } catch (error) {
    console.error('Erro ao buscar ISBN no backend:', error);
    throw new Error('Livro não encontrado nas bases de dados.');
  }
};
