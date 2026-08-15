import { createServerFn } from '@tanstack/react-start'

import { listFeatureTestCasesSchema } from '#/features/test-cases/schemas/test-case.ts'
import { listFeatureTestCases } from '#/features/test-cases/server/test-cases.server.ts'

export const listTestCases = createServerFn({ method: 'GET' })
  .validator(listFeatureTestCasesSchema)
  .handler(async ({ data }) => {
    return listFeatureTestCases(data.featureId)
  })
