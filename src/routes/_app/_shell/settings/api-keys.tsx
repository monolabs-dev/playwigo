import { createFileRoute } from '@tanstack/react-router'

import { ApiKeysPage } from '#/features/api-keys/components/api-keys-page.tsx'

export const Route = createFileRoute('/_app/_shell/settings/api-keys')({
  component: ApiKeysPage,
  head: () => ({
    meta: [{ title: 'API Keys — Playwigo' }],
  }),
})
