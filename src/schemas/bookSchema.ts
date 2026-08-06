import { z } from './zod';

/**
 * Tamanho mínimo do ISBN. Sai da frase e entra por interpolação (`{{min}}`)
 * para que a regra e a mensagem não possam divergir na tradução.
 */
export const MIN_ISBN_LENGTH = 10;

// As mensagens são **chaves** de i18n (namespace `book`): o schema é criado no
// carregamento do módulo, fora da árvore React, então quem traduz é o formulário.
export const bookSchema = z.object({
  isbn: z.string().min(MIN_ISBN_LENGTH, 'form.error.isbn_min'),
  nome: z.string().min(1, 'form.error.title_required'),
  data_lancamento: z.string().optional(),
  numero_paginas: z.coerce.number().min(1, 'form.error.pages_invalid'),
  cdd: z.string().optional(),
  editora: z.string().min(1, 'form.error.publisher_required'),
  classificacao_etaria: z.string().min(1, 'form.error.classification_required'),
  tipo_capa: z.string().optional(),
  autor: z.string().min(1, 'form.error.author_required'),
  generos: z.array(z.string()).min(1, 'form.error.genres_required'),
  sinopse: z.string().optional(),
  edicao: z.string().optional(),
  volume: z.coerce.number().optional(),
});

export type BookFormData = z.infer<typeof bookSchema>;
