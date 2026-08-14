import { createFileRoute } from '@tanstack/react-router'

import { SignInPage } from '#/features/auth/components/sign-in-page.tsx'

export const Route = createFileRoute('/login')({
  component: SignInPage,
  head: () => ({
    meta: [{ title: 'Sign in — Playwigo' }],
  }),
})
