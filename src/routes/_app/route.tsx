import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '#/features/auth/server/session.ts'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()

    if (!session) {
      const search =
        typeof location.searchStr === 'string' && location.searchStr.length > 0
          ? location.searchStr.startsWith('?')
            ? location.searchStr
            : `?${location.searchStr}`
          : ''

      throw redirect({
        to: '/login',
        search: {
          redirect:
            location.pathname === '/dashboard'
              ? undefined
              : `${location.pathname}${search}`,
        },
      })
    }

    return { session }
  },
  component: AppLayout,
})

function AppLayout() {
  return <Outlet />
}
