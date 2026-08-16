import { createFileRoute } from '@tanstack/react-router'

import { readSession } from '#/features/auth/server/session.server.ts'
import { readOwnedTestRunStepScreenshot } from '#/features/test-cases/server/test-run-screenshots.server.ts'

export const Route = createFileRoute(
  '/api/screenshots/test-runs/$testRunId/$stepId',
)({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // Supports session cookie and Better Auth apiKey via x-api-key
        // (enableSessionForAPIKeys mocks a session for getSession).
        const session = await readSession()

        if (!session) {
          return Response.json(
            { error: { code: 'unauthorized', message: 'Unauthorized' } },
            { status: 401 },
          )
        }

        try {
          const object = await readOwnedTestRunStepScreenshot(
            params.testRunId,
            params.stepId,
          )

          if (!object) {
            return new Response('Not Found', { status: 404 })
          }

          const headers = new Headers()
          object.writeHttpMetadata(headers)
          headers.set('etag', object.httpEtag)
          headers.set('cache-control', 'private, max-age=3600')

          return new Response('body' in object ? object.body : null, {
            status: 'body' in object ? 200 : 412,
            headers,
          })
        } catch {
          return new Response('Not Found', { status: 404 })
        }
      },
    },
  },
})
