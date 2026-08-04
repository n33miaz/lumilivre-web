import { z } from 'zod';

// Campos de build vêm de <input type="number"> como string; validamos como
// inteiro não-negativo e convertemos para número no submit.
const buildField = z
  .string()
  .trim()
  .regex(/^\d+$/, 'build');

export const appVersionSchema = z.object({
  versaoMaisRecente: z.string().trim().min(1, 'required'),
  buildMaisRecente: buildField,
  versaoMinima: z.string().trim().min(1, 'required'),
  buildMinimo: buildField,
  forcarAtualizacao: z.boolean(),
  mensagemAtualizacao: z.string().optional().or(z.literal('')),
  // Aceitar apenas URL http(s) — o app abre este valor via url_launcher.
  urlLoja: z
    .string()
    .trim()
    .url('url')
    .regex(/^https?:\/\//i, 'url')
    .optional()
    .or(z.literal('')),
});

export type AppVersionFormData = z.infer<typeof appVersionSchema>;
