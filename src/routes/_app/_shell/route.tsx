import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppShell } from '#/features/dashboard/components/app-shell.tsx'
import { listProjects } from '#/features/projects/server/projects.ts'

export const Route = createFileRoute('/_app/_shell')({
  loader: async () => {
    const projects = await listProjects()

    if (projects.length === 0) {
      throw redirect({ to: '/onboard' })
    }

    return { projects }
  },
  component: AppShellLayout,
})

function AppShellLayout() {
  const { session } = Route.useRouteContext()
  const { projects } = Route.useLoaderData()

  return (
    <AppShell user={session.user} projects={projects}>
      <Outlet />
    </AppShell>
  )
}
