import { createFileRoute, redirect } from '@tanstack/react-router'

import { OnboardProjectPage } from '#/features/projects/components/onboard-project-page.tsx'
import { listProjects } from '#/features/projects/server/projects.ts'

export const Route = createFileRoute('/_app/onboard')({
  loader: async () => {
    const projects = await listProjects()

    if (projects.length > 0) {
      throw redirect({ to: '/dashboard' })
    }

    return null
  },
  component: OnboardProjectPage,
  head: () => ({
    meta: [{ title: 'Create your first project — Playwigo' }],
  }),
})
