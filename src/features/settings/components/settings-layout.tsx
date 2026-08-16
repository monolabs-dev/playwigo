import { Link, Outlet, useRouterState } from '@tanstack/react-router'

import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs.tsx'

const tabs = [
  { label: 'Project', to: '/settings/project' as const },
  { label: 'API Keys', to: '/settings/api-keys' as const },
] as const

export function SettingsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const activeTab =
    tabs.find((tab) => pathname.startsWith(tab.to))?.to ?? '/settings/project'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="space-y-4">
        <div className="min-w-0">
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage project details and API keys for agents and the CLI.
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
