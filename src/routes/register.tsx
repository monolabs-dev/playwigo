import { createFileRoute, redirect } from '@tanstack/react-router'

import { SignUpPage } from '#/features/auth/components/sign-up-page.tsx'
import { authSearchSchema } from '#/features/auth/schemas/credentials.ts'
import { getSession } from '#/features/auth/server/session.ts'
import { getSafeRedirect } from '#/features/auth/utils/safe-redirect.ts'

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await getSession()

    if (session) {
      throw redirect({ href: getSafeRedirect(search.redirect) })
    }
  },
  component: RegisterRoute,
  head: () => ({
    meta: [{ title: 'Create account — Playwigo' }],
  }),
})

function RegisterRoute() {
  const { redirect: redirectTo, error } = Route.useSearch()

  return (
    <SignUpPage redirectTo={getSafeRedirect(redirectTo)} oauthError={error} />
  )
}
