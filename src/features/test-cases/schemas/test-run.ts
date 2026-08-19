import { z } from 'zod'

const runVariableValueSchema = z.string().max(2000, 'Variable value is too long')

export const runVariablesSchema = z
  .record(
    z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(
        /^[A-Za-z_][A-Za-z0-9_]*$/,
        'Variable names must use letters, numbers, and underscores',
      ),
    runVariableValueSchema,
  )
  .refine((value) => Object.keys(value).length <= 50, {
    message: 'Too many variables (max 50)',
  })
  .optional()

export const runTestCaseSchema = z.object({
  testCaseId: z.string().min(1),
  variables: runVariablesSchema,
})

export const getTestRunStatusSchema = z.object({
  testRunId: z.string().min(1),
})

export const listProjectTestRunsSchema = z.object({
  projectId: z.string().min(1),
  limit: z.number().int().min(1).max(200).optional(),
})

export type RunTestCaseInput = z.input<typeof runTestCaseSchema>
export type GetTestRunStatusInput = z.input<typeof getTestRunStatusSchema>
export type ListProjectTestRunsInput = z.input<typeof listProjectTestRunsSchema>
