import { createFileRoute } from '@tanstack/react-router'

import { LandingPage } from '#/features/landing/components/landing-page.tsx'
import { getSession } from '#/features/auth/server/session.ts'

export const Route = createFileRoute('/')({
  loader: () => getSession(),
  component: HomeRoute,
  head: () => ({
    meta: [
      { title: 'Playwigo — Playwright on the go' },
      {
        name: 'description',
        content:
          'Create, manage, and run Playwright test cases with ease. Organize your projects, track features, and automate your testing workflow.',
      },
    ],
  }),
})

function HomeRoute() {
  const session = Route.useLoaderData()

  return <LandingPage session={session} />
}
