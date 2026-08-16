import { createFileRoute } from '@tanstack/react-router'

import { listUserProjects } from '#/features/projects/server/projects.server.ts'
import { handleApi, methodNotAllowed } from '#/server/api/respond.ts'

export const Route = createFileRoute('/api/v1/projects')({
  server: {
    handlers: {
      GET: async () => handleApi(() => listUserProjects()),
      POST: async () => methodNotAllowed(),
    },
  },
})
