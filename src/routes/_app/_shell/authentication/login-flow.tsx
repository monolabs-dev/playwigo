import { createFileRoute } from '@tanstack/react-router'

import { LoginFlowPage } from '#/features/login-flows/components/login-flow-page.tsx'

export const Route = createFileRoute(
  '/_app/_shell/authentication/login-flow',
)({
  component: LoginFlowPage,
  head: () => ({
    meta: [{ title: 'Authentication — Login flow — Playwigo' }],
  }),
})
