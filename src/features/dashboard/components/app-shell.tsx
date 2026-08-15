import type { ReactNode } from 'react'
import { CirclePlay, Plus, Search } from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import { Separator } from '#/components/ui/separator.tsx'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar.tsx'
import { TooltipProvider } from '#/components/ui/tooltip.tsx'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb.tsx'
import {
  ActiveProjectProvider,
  useActiveProject,
} from '#/features/dashboard/hooks/active-project.tsx'
import { AppSidebar } from '#/features/dashboard/components/app-sidebar.tsx'
import { ProjectCommand } from '#/features/dashboard/components/project-command.tsx'
import { RunCommand } from '#/features/dashboard/components/run-command.tsx'
import { CreateProjectDialog } from '#/features/projects/components/create-project-dialog.tsx'
import type { Project } from '#/features/projects/types/project.ts'
import { comingSoon } from '#/features/dashboard/utils/coming-soon.ts'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/features': 'Features',
  '/test-runs': 'Test runs',
  '/settings': 'Settings',
  '/authentication/accounts': 'Authentication',
  '/authentication/login-flow': 'Authentication',
}

export function AppShell({
  user,
  projects,
  children,
}: {
  user: { name: string; email: string; image?: string | null }
  projects: Project[]
  children: ReactNode
}) {
  return (
    <ActiveProjectProvider projects={projects}>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          <AppSidebar user={user} />
          <AppInset>{children}</AppInset>
          <ProjectCommand />
          <RunCommand />
          <CreateProjectHost />
        </SidebarProvider>
      </TooltipProvider>
    </ActiveProjectProvider>
  )
}

function CreateProjectHost() {
  const { createOpen, setCreateOpen, selectProject } = useActiveProject()

  return (
    <CreateProjectDialog
      open={createOpen}
      onOpenChange={setCreateOpen}
      onCreated={(project) => {
        selectProject(project.id)
        toast.success('Project created', {
          description: project.name,
        })
      }}
    />
  )
}

function AppInset({ children }: { children: ReactNode }) {
  const { project, setSwitcherOpen, setRunCommandOpen } = useActiveProject()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const pageTitle = pathname.startsWith('/features/')
    ? 'Feature'
    : pathname.startsWith('/authentication')
      ? 'Authentication'
      : PAGE_TITLES[pathname] ?? 'Dashboard'

  return (
    <SidebarInset>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/80 px-3 backdrop-blur-xl md:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList>
            <BreadcrumbItem>
              <button
                type="button"
                className="max-w-40 truncate transition-colors hover:text-foreground sm:max-w-none"
                onClick={() => setSwitcherOpen(true)}
              >
                {project.name}
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="md:hidden"
            aria-label="Switch project"
            onClick={() => setSwitcherOpen(true)}
          >
            <Search />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-2 text-muted-foreground md:inline-flex"
            onClick={() => setSwitcherOpen(true)}
          >
            <Search className="size-3.5" />
            Switch project
            <kbd className="pointer-events-none ml-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button
            size="sm"
            className="h-8"
            aria-label="Run tests"
            onClick={() => setRunCommandOpen(true)}
          >
            <CirclePlay />
            <span className="hidden sm:inline">Run</span>
          </Button>
        </div>
      </header>
      {children}
    </SidebarInset>
  )
}
