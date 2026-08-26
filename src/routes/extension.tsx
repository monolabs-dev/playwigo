import { createFileRoute } from '@tanstack/react-router'

import { ExtensionDownloadPage } from '#/features/extension/components/extension-download-page.tsx'
import { getSession } from '#/features/auth/server/session.ts'

export const Route = createFileRoute('/extension')({
  loader: () => getSession(),
  component: ExtensionRoute,
  head: () => ({
    meta: [
      { title: 'Browser extension — Playwigo' },
      {
        name: 'description',
        content:
          'Download the Playwigo Recorder Chrome extension and install it manually while we prepare the Chrome Web Store listing.',
      },
    ],
  }),
})

function ExtensionRoute() {
  const session = Route.useLoaderData()

  return <ExtensionDownloadPage session={session} />
}
