import { z } from 'zod';

export const tccSchema = z.object({
  titulo: z.string().min(1, 'O título é obrigatório'),
  leitores: z.string().min(1, 'Informe os leitores'),
  orientadores: z.string().optional(),
  curso_id: z.coerce.number().min(1, 'Selecione um curso válido'),
  anoConclusao: z.string().min(4, 'Ano inválido'),
  semestreConclusao: z.string().min(1, 'Selecione o semestre'),
  linkExterno: z.string().optional(),
  ativo: z.boolean().default(true),
});

export type TccFormData = z.infer<typeof tccSchema>;
