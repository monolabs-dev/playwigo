import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ExtensionConnectPage } from '#/features/extension/components/extension-connect-page.tsx'

const extensionConnectSearchSchema = z.object({
  state: z.string().min(8).max(128),
  extensionId: z.string().min(8).max(128),
})

export const Route = createFileRoute('/_app/extension/connect')({
  validateSearch: extensionConnectSearchSchema,
  component: ExtensionConnectRoute,
  head: () => ({
    meta: [{ title: 'Connect extension — Playwigo' }],
  }),
})

function ExtensionConnectRoute() {
  const { state, extensionId } = Route.useSearch()
  return <ExtensionConnectPage state={state} extensionId={extensionId} />
}
