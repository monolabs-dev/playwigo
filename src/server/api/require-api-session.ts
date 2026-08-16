import { readSession } from '#/features/auth/server/session.server.ts'
import { ApiUnauthorizedError } from '#/server/api/errors.ts'

export async function requireApiSession() {
  const session = await readSession()

  if (!session) {
    throw new ApiUnauthorizedError()
  }

  return session
}
