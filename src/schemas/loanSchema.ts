import { z } from './zod';

// Mensagens são **chaves** de i18n (namespace `loan`); o formulário traduz.
export const loanSchema = z.object({
  leitor_matricula: z.string().min(1, 'form.error.reader_required'),
  livro_id: z.string().min(1, 'form.error.book_required'),
  exemplar_tombo: z.string().min(1, 'form.error.copy_required'),
  data_emprestimo: z.string().min(10, 'form.error.borrowed_at_invalid'),
  data_devolucao: z.string().min(10, 'form.error.due_at_invalid'),
});

export type LoanFormData = z.infer<typeof loanSchema>;
