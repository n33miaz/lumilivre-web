import { z } from 'zod';

export const contentSchema = z.object({
  contentType: z.enum(['ANNOUNCEMENT', 'ATTACHMENT', 'WORK']),
  title: z.string().min(1, 'O título é obrigatório'),
  body: z.string().optional(),
  authors: z.string().optional(),
  advisors: z.string().optional(),
  completionYear: z.string().optional(),
  completionSemester: z.string().optional(),
  // NEW-01: só URL http(s) — vai para o app e é aberta via url_launcher.
  externalUrl: z
    .string()
    .trim()
    .url('url')
    .regex(/^https?:\/\//i, 'url')
    .optional()
    .or(z.literal('')),
  // Visibilidade
  published: z.boolean().default(true),
  pinned: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
  audienceScope: z.enum(['ALL', 'COURSE', 'MODULE', 'SHIFT']).default('ALL'),
  courseId: z.coerce.number().optional(),
  academicModuleId: z.coerce.number().optional(),
  studyShiftId: z.coerce.number().optional(),
  publishStartAt: z.string().optional(),
  publishEndAt: z.string().optional(),
});

export type ContentFormData = z.infer<typeof contentSchema>;
