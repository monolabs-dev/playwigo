import { createFileRoute } from '@tanstack/react-router'

import { TestRunsPage } from '#/features/test-cases/components/test-runs-page.tsx'

export const Route = createFileRoute('/_app/_shell/test-runs')({
  component: TestRunsPage,
  head: () => ({
    meta: [{ title: 'Test runs — Playwigo' }],
  }),
})
