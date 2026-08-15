import { z } from 'zod'

export const runTestCaseSchema = z.object({
  testCaseId: z.string().min(1),
})

export const getTestRunStatusSchema = z.object({
  testRunId: z.string().min(1),
})

export type RunTestCaseInput = z.input<typeof runTestCaseSchema>
export type GetTestRunStatusInput = z.input<typeof getTestRunStatusSchema>
