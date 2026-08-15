import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '#/features/auth/server/session.ts'
import { AppShell } from '#/features/dashboard/components/app-shell.tsx'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect:
            location.pathname === '/dashboard' ? undefined : location.pathname,
        },
      })
    }

    return { session }
  },
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()

  return (
    <AppShell user={session.user}>
      <Outlet />
    </AppShell>
  )
}
