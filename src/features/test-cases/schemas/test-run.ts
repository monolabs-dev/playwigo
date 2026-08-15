import { z } from 'zod'

export const runTestCaseSchema = z.object({
  testCaseId: z.string().min(1),
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
