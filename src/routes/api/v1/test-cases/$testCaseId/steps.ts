import { createFileRoute } from '@tanstack/react-router'

import { replaceTestCaseStepsSchema } from '#/features/test-cases/schemas/test-case-step.ts'
import {
  listOwnedTestCaseSteps,
  replaceOwnedTestCaseSteps,
} from '#/features/test-cases/server/test-cases.server.ts'
import {
  handleApi,
  methodNotAllowed,
  parseJsonBody,
} from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/test-cases/$testCaseId/steps')({
  server: {
    handlers: {
      GET: async ({ params }) =>
        handleApi(() => listOwnedTestCaseSteps(params.testCaseId)),
      PUT: async ({ request, params }) =>
        handleApi(async () => {
          const body = await parseJsonBody(
            request,
            replaceTestCaseStepsSchema.omit({ testCaseId: true }),
          )
          return replaceOwnedTestCaseSteps({
            ...body,
            testCaseId: params.testCaseId,
          })
        }),
      POST: async () => methodNotAllowed(),
      DELETE: async () => methodNotAllowed(),
    },
  },
})
