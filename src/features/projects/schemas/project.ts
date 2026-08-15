import { z } from 'zod'

import {
  isHttpUrl,
  normalizeWebsite,
} from '#/features/projects/utils/website.ts'

const projectFields = {
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
} as const

export const createProjectSchema = z.object(projectFields)

export const updateProjectSchema = z.object({
  id: z.string().min(1),
  ...projectFields,
})

export const deleteProjectSchema = z.object({
  id: z.string().min(1),
})

export type CreateProjectInput = z.input<typeof createProjectSchema>
export type CreateProjectValues = z.output<typeof createProjectSchema>
export type UpdateProjectInput = z.input<typeof updateProjectSchema>
export type UpdateProjectValues = z.output<typeof updateProjectSchema>
