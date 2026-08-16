import { createFileRoute } from '@tanstack/react-router'

import { runOwnedTestCase } from '#/features/test-cases/server/test-runs.server.ts'
import { handleApi, methodNotAllowed } from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/test-cases/$testCaseId/run')({
  server: {
    handlers: {
      POST: async ({ params }) =>
        handleApi(() => runOwnedTestCase(params.testCaseId)),
      GET: async () => methodNotAllowed(),
    },
  },
})
