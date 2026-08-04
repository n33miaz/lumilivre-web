import { z } from 'zod';

export const MANAGEABLE_ROLES = ['ADMIN', 'LIBRARIAN'] as const;

const baseUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional().or(z.literal('')),
  role: z.enum(MANAGEABLE_ROLES),
});

export type UserFormData = z.infer<typeof baseUserSchema>;

/**
 * Na criação a senha é obrigatória (mín. 6). Na edição, é opcional — quando em
 * branco, mantém a senha atual; quando informada, precisa ter mín. 6.
 */
export function buildUserSchema(isEdit: boolean) {
  return baseUserSchema.superRefine((data, ctx) => {
    const pwd = data.password ?? '';
    if (!isEdit && pwd.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'min',
      });
      return;
    }
    if (isEdit && pwd.length > 0 && pwd.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'min',
      });
    }
  });
}
