import { z } from './zod';

export const readerSchema = z.object({
  nomeCompleto: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  matricula: z.string().min(1, 'A matrícula é obrigatória'),
  cpf: z.string().optional(),
  celular: z.string().optional(),
  dataNascimento: z.string().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
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
  ['cursoId', 'O curso é obrigatório'],
  ['turnoId', 'O turno é obrigatório'],
  ['moduloId', 'O módulo é obrigatório'],
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
