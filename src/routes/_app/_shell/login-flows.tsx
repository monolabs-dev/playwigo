import { createFileRoute } from '@tanstack/react-router'

import { LoginFlowPage } from '#/features/login-flows/components/login-flow-page.tsx'

export const Route = createFileRoute('/_app/_shell/login-flows')({
  component: LoginFlowPage,
  head: () => ({
    meta: [{ title: 'Login flow — Playwigo' }],
  }),
})
