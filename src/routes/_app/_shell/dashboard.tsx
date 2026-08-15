import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '#/features/dashboard/components/dashboard-page.tsx'

export const Route = createFileRoute('/_app/_shell/dashboard')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard — Playwigo' }],
  }),
})
