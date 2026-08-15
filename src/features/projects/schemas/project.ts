import { z } from 'zod'

import {
  isHttpUrl,
  normalizeWebsite,
} from '#/features/projects/utils/website.ts'

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
  website: z
    .string()
    .trim()
    .min(1, 'Website is required')
    .max(2048, 'URL is too long')
    .transform(normalizeWebsite)
    .refine(isHttpUrl, 'Enter a valid URL'),
})

export type CreateProjectInput = z.input<typeof createProjectSchema>
export type CreateProjectValues = z.output<typeof createProjectSchema>
