import { z } from 'zod'

import {
  isHttpUrl,
  normalizeWebsite,
} from '#/features/projects/utils/website.ts'

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length === 0 ? null : value))
    .optional()
    .nullable()

const optionalUrl = z
  .string()
  .trim()
  .max(2048, 'URL is too long')
  .transform((value) => (value.length === 0 ? null : normalizeWebsite(value)))
  .refine((value) => value === null || isHttpUrl(value), 'Enter a valid URL')
  .optional()
  .nullable()

const accountFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
  description: optionalText(500, 'Description is too long'),
  email: z
    .union([
      z.literal(''),
      z.string().trim().email('Enter a valid email address'),
    ])
    .transform((value) => (value === '' ? null : value))
    .optional()
    .nullable(),
  password: optionalText(256, 'Password is too long'),
  url: optionalUrl,
} as const

export const testAccountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long'),
  email: z.union([
    z.literal(''),
    z.string().trim().email('Enter a valid email address'),
  ]),
  password: z.string().trim().max(256, 'Password is too long'),
  url: z.string().trim().max(2048, 'URL is too long'),
})

export const createTestAccountSchema = z.object({
  projectId: z.string().min(1),
  ...accountFields,
})

export const updateTestAccountSchema = z.object({
  id: z.string().min(1),
  ...accountFields,
})

export const deleteTestAccountSchema = z.object({
  id: z.string().min(1),
})

export const listTestAccountsSchema = z.object({
  projectId: z.string().min(1),
})

export type CreateTestAccountInput = z.input<typeof createTestAccountSchema>
export type CreateTestAccountValues = z.output<typeof createTestAccountSchema>
export type UpdateTestAccountInput = z.input<typeof updateTestAccountSchema>
export type UpdateTestAccountValues = z.output<typeof updateTestAccountSchema>
