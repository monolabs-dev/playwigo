import { createFileRoute } from '@tanstack/react-router'

import { createTestCaseSchema } from '#/features/test-cases/schemas/test-case.ts'
import {
  insertTestCase,
  listFeatureTestCases,
} from '#/features/test-cases/server/test-cases.server.ts'
import {
  handleApi,
  methodNotAllowed,
  parseJsonBody,
} from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/features/$featureId/test-cases')({
  server: {
    handlers: {
      GET: async ({ params }) =>
        handleApi(() => listFeatureTestCases(params.featureId)),
      POST: async ({ request, params }) =>
        handleApi(async () => {
          const body = await parseJsonBody(
            request,
            createTestCaseSchema.omit({ featureId: true }),
          )
          return insertTestCase({ ...body, featureId: params.featureId })
        }),
      PUT: async () => methodNotAllowed(),
      DELETE: async () => methodNotAllowed(),
    },
  },
})
