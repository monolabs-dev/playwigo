import { createFileRoute } from '@tanstack/react-router'

import { listProjectTestRunsSchema } from '#/features/test-cases/schemas/test-run.ts'
import { listProjectTestRuns } from '#/features/test-cases/server/test-runs.server.ts'
import { handleApi, methodNotAllowed } from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/projects/$projectId/test-runs')({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        handleApi(async () => {
          const url = new URL(request.url)
          const limitRaw = url.searchParams.get('limit')
          const parsed = listProjectTestRunsSchema.parse({
            projectId: params.projectId,
            limit: limitRaw ? Number(limitRaw) : undefined,
          })
          return listProjectTestRuns(parsed.projectId, parsed.limit)
        }),
      POST: async () => methodNotAllowed(),
    },
  },
})
