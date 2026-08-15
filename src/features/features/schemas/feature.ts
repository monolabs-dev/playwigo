import { z } from 'zod'

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length === 0 ? null : value))
    .optional()
    .nullable()

const featureFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
  description: optionalText(500, 'Description is too long'),
} as const

export const featureFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long'),
})

export const createFeatureSchema = z.object({
  projectId: z.string().min(1),
  ...featureFields,
})

export const updateFeatureSchema = z.object({
  id: z.string().min(1),
  ...featureFields,
})

export const deleteFeatureSchema = z.object({
  id: z.string().min(1),
})

export const listFeaturesSchema = z.object({
  projectId: z.string().min(1),
})

export const countFeaturesSchema = z.object({
  projectId: z.string().min(1),
})

export const getFeatureSchema = z.object({
  featureId: z.string().min(1),
})

export type CreateFeatureInput = z.input<typeof createFeatureSchema>
export type CreateFeatureValues = z.output<typeof createFeatureSchema>
export type UpdateFeatureInput = z.input<typeof updateFeatureSchema>
export type UpdateFeatureValues = z.output<typeof updateFeatureSchema>
