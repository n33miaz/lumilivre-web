import { z } from 'zod';

export const studentSchema = z.object({
  nomeCompleto: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  matricula: z.string().min(1, 'A matrícula é obrigatória'),
  cpf: z.string().optional(),
  celular: z.string().optional(),
  dataNascimento: z.string().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  cursoId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '', 'Selecione um curso'),
  turnoId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '', 'Selecione um turno'),
  moduloId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '', 'Selecione um módulo'),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
  numero_casa: z.union([z.string(), z.number()]).optional(),
  complemento: z.string().optional(),
  penalidade: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;
