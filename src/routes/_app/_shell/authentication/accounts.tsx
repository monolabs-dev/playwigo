import { createFileRoute } from '@tanstack/react-router'

import { TestAccountsPage } from '#/features/test-accounts/components/test-accounts-page.tsx'

export const Route = createFileRoute('/_app/_shell/authentication/accounts')({
  component: TestAccountsPage,
  head: () => ({
    meta: [{ title: 'Authentication — Accounts — Playwigo' }],
  }),
})
