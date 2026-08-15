import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth.ts'

export async function readSession() {
  try {
    return await auth.api.getSession({
      headers: getRequest().headers,
    })
  } catch {
    return null
  }
}

export async function requireSession() {
  const session = await readSession()

  if (!session) {
    throw redirect({ to: '/login' })
  }

  return session
}
