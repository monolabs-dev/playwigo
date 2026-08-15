import { Link, Outlet, useRouterState } from '@tanstack/react-router'

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '#/components/ui/tabs.tsx'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'

const tabs = [
  { label: 'Accounts', to: '/authentication/accounts' as const },
  { label: 'Login flow', to: '/authentication/login-flow' as const },
] as const

export function AuthenticationLayout() {
  const { project } = useActiveProject()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const activeTab =
    tabs.find((tab) => pathname.startsWith(tab.to))?.to ??
    '/authentication/accounts'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="space-y-4">
        <div className="min-w-0">
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Authentication
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Save test account credentials and define how Playwright signs in
            before runs for{' '}
            <span className="text-foreground">{project.name}</span>.
          </p>
        </div>

        <Tabs value={activeTab}>
          <TabsList variant="line">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.to} value={tab.to} asChild>
                <Link to={tab.to}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <Outlet />
    </div>
  )
}
