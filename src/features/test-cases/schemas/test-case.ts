import { z } from 'zod'

import {
  isHttpUrl,
  normalizeWebsite,
} from '#/features/projects/utils/website.ts'

const optionalUrl = z
  .string()
  .trim()
  .max(2048, 'URL is too long')
  .transform((value) => (value.length === 0 ? null : normalizeWebsite(value)))
  .refine((value) => value === null || isHttpUrl(value), 'Enter a valid URL')
  .optional()
  .nullable()

const optionalTestAccountId = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .optional()
  .nullable()

const testCaseFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name is too long'),
  baseUrl: optionalUrl,
  testAccountId: optionalTestAccountId,
} as const

export const testCaseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name is too long'),
  baseUrl: z.string().trim().max(2048, 'URL is too long'),
  testAccountId: z.string(),
})

export const listFeatureTestCasesSchema = z.object({
  featureId: z.string().min(1),
})

export const createTestCaseSchema = z.object({
  featureId: z.string().min(1),
  ...testCaseFields,
})

export const updateTestCaseSchema = z.object({
  id: z.string().min(1),
  ...testCaseFields,
})

export const deleteTestCaseSchema = z.object({
  id: z.string().min(1),
})

export type CreateTestCaseInput = z.input<typeof createTestCaseSchema>
export type CreateTestCaseValues = z.output<typeof createTestCaseSchema>
export type UpdateTestCaseInput = z.input<typeof updateTestCaseSchema>
export type UpdateTestCaseValues = z.output<typeof updateTestCaseSchema>
