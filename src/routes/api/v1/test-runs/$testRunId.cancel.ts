import { createFileRoute } from '@tanstack/react-router'

import { cancelOwnedTestRun } from '#/features/test-cases/server/test-runs.server.ts'
import { handleApi, methodNotAllowed } from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/test-runs/$testRunId/cancel')({
  server: {
    handlers: {
      POST: async ({ params }) =>
        handleApi(() => cancelOwnedTestRun(params.testRunId)),
      GET: async () => methodNotAllowed(),
    },
  },
})
