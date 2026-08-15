import { createServerFn } from '@tanstack/react-start'

import {
  readSession,
  requireSession,
} from '#/features/auth/server/session.server.ts'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    return readSession()
  },
)

export const ensureSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    return requireSession()
  },
)
