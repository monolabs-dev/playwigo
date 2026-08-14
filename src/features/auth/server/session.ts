import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth.ts'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      return await auth.api.getSession({
        headers: getRequest().headers,
      })
    } catch {
      return null
    }
  },
)

export const ensureSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })

    if (!session) {
      throw new Error('Unauthorized')
    }

    return session
  },
)
