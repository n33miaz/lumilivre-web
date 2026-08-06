import { z } from './zod';
import { MIN_PASSWORD_LENGTH } from '../utils/passwordPolicy';

export const MANAGEABLE_ROLES = ['ADMIN', 'LIBRARIAN'] as const;

const baseUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional().or(z.literal('')),
  role: z.enum(MANAGEABLE_ROLES),
});

export type UserFormData = z.infer<typeof baseUserSchema>;

/**
 * Na criação a senha é obrigatória (mín. `MIN_PASSWORD_LENGTH`). Na edição, é
 * opcional — quando em branco, mantém a senha atual; quando informada, precisa
 * respeitar o mesmo mínimo.
 */
export function buildUserSchema(isEdit: boolean) {
  return baseUserSchema.superRefine((data, ctx) => {
    const pwd = data.password ?? '';
    if (!isEdit && pwd.length < MIN_PASSWORD_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'min',
      });
      return;
    }
    if (isEdit && pwd.length > 0 && pwd.length < MIN_PASSWORD_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'min',
      });
    }
  });
}
