import { createFileRoute } from '@tanstack/react-router'

import { getOwnedTestRunStatus } from '#/features/test-cases/server/test-runs.server.ts'
import { handleApi, methodNotAllowed } from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/test-runs/$testRunId')({
  server: {
    handlers: {
      GET: async ({ params }) =>
        handleApi(() => getOwnedTestRunStatus(params.testRunId)),
      POST: async () => methodNotAllowed(),
    },
  },
})
