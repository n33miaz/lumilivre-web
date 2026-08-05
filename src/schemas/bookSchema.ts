import { z } from './zod';

export const bookSchema = z.object({
  isbn: z.string().min(10, 'ISBN deve ter no mínimo 10 caracteres'),
  nome: z.string().min(1, 'O título do livro é obrigatório'),
  data_lancamento: z.string().optional(),
  numero_paginas: z.coerce.number().min(1, 'Número de páginas inválido'),
  cdd: z.string().optional(),
  editora: z.string().min(1, 'A editora é obrigatória'),
  classificacao_etaria: z.string().min(1, 'A classificação é obrigatória'),
  tipo_capa: z.string().optional(),
  autor: z.string().min(1, 'O autor é obrigatório'),
  generos: z.array(z.string()).min(1, 'Selecione ao menos um gênero'),
  sinopse: z.string().optional(),
  edicao: z.string().optional(),
  volume: z.coerce.number().optional(),
});

export type BookFormData = z.infer<typeof bookSchema>;
