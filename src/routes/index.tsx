import { createFileRoute } from '@tanstack/react-router'

import { LandingPage } from '#/features/landing/components/landing-page.tsx'

export const Route = createFileRoute('/')({
  component: LandingPage,
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
