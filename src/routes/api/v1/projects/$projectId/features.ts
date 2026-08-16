import { createFileRoute } from '@tanstack/react-router'

import { createFeatureSchema } from '#/features/features/schemas/feature.ts'
import {
  insertFeature,
  listProjectFeatures,
} from '#/features/features/server/features.server.ts'
import {
  handleApi,
  methodNotAllowed,
  parseJsonBody,
} from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/projects/$projectId/features')({
  server: {
    handlers: {
      GET: async ({ params }) =>
        handleApi(() => listProjectFeatures(params.projectId)),
      POST: async ({ request, params }) =>
        handleApi(async () => {
          const body = await parseJsonBody(
            request,
            createFeatureSchema.omit({ projectId: true }),
          )
          return insertFeature({ ...body, projectId: params.projectId })
        }),
      PUT: async () => methodNotAllowed(),
      DELETE: async () => methodNotAllowed(),
    },
  },
})
