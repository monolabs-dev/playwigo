import { z } from 'zod'

export const listFeatureTestCasesSchema = z.object({
  featureId: z.string().min(1),
})
