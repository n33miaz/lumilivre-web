import { z } from 'zod';

export const loanSchema = z.object({
  leitor_matricula: z.string().min(1, 'Selecione um leitor'),
  livro_id: z.string().min(1, 'Selecione um livro'),
  exemplar_tombo: z.string().min(1, 'Selecione um exemplar'),
  data_emprestimo: z.string().min(10, 'Data de empréstimo inválida'),
  data_devolucao: z.string().min(10, 'Data de devolução inválida'),
});

export type LoanFormData = z.infer<typeof loanSchema>;
