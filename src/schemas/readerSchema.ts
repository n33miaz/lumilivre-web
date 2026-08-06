import { z } from './zod';

/**
 * Tamanho mínimo do nome. Sai da frase e entra por interpolação (`{{min}}`)
 * para que a regra e a mensagem não possam divergir na tradução.
 */
export const MIN_READER_NAME_LENGTH = 3;

// Mensagens são **chaves** de i18n (namespace `reader`); o formulário traduz.
export const readerSchema = z.object({
  nomeCompleto: z
    .string()
    .min(MIN_READER_NAME_LENGTH, 'form.error.name_min'),
  matricula: z.string().min(1, 'form.error.registration_required'),
  cpf: z.string().optional(),
  celular: z.string().optional(),
  dataNascimento: z.string().optional(),
  email: z
    .string()
    .email('form.error.email_invalid')
    .or(z.literal(''))
    .optional(),
  cursoId: z.union([z.string(), z.number()]).optional(),
  turnoId: z.union([z.string(), z.number()]).optional(),
  moduloId: z.union([z.string(), z.number()]).optional(),
  readerCategory: z.string().max(80).optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
  numero_casa: z.union([z.string(), z.number()]).optional(),
  complemento: z.string().optional(),
  penalidade: z.string().optional(),
  // Foto: só a URL atual (preview). O arquivo novo é passado à parte no submit
  // (padrão do BookForm), sem validação zod.
  foto: z.string().optional(),
});

export type ReaderFormData = z.infer<typeof readerSchema>;

const requiredAcademicFields = [
  ['cursoId', 'form.error.course_required'],
  ['turnoId', 'form.error.shift_required'],
  ['moduloId', 'form.error.module_required'],
] as const;

/** Em bibliotecas escolares, curso/turno/módulo são obrigatórios. */
export function buildReaderSchema(requireAcademic: boolean) {
  return readerSchema.superRefine((data, ctx) => {
    if (!requireAcademic) return;
    for (const [field, message] of requiredAcademicFields) {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
    }
  });
}
