import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { runVariablesSchema } from '#/features/test-cases/schemas/test-run.ts'
import { runOwnedTestCase } from '#/features/test-cases/server/test-runs.server.ts'
import {
  handleApi,
  methodNotAllowed,
  parseJsonBody,
} from '#/server/api/respond.ts'

const runBodySchema = z.object({
  variables: runVariablesSchema,
})

export const Route = createFileRoute('/api/v1/test-cases/$testCaseId/run')({
  server: {
    handlers: {
      POST: async ({ request, params }) =>
        handleApi(async () => {
          const contentType = request.headers.get('content-type') ?? ''
          let variables: Record<string, string> | undefined

          if (contentType.includes('application/json')) {
            const body = await parseJsonBody(request, runBodySchema)
            variables = body.variables
          }

          return runOwnedTestCase(params.testCaseId, variables)
        }),
      GET: async () => methodNotAllowed(),
    },
  },
})
