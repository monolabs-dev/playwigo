import { Link, useRouterState } from '@tanstack/react-router'
import {
  BugPlay,
  CirclePlay,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '#/components/ui/sidebar.tsx'
import { NavUser } from '#/features/dashboard/components/nav-user.tsx'
import { ProjectSwitcher } from '#/features/dashboard/components/project-switcher.tsx'

const primaryNav = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' as const },
  { title: 'Features', icon: FolderKanban, href: '/features' as const },
  {
    title: 'Authentication',
    icon: KeyRound,
    href: '/authentication/accounts' as const,
  },
  { title: 'Test runs', icon: CirclePlay, href: '/test-runs' as const },
] as const

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string; image?: string | null }
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BugPlay className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Playwigo</span>
        </div>
        <ProjectSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-1">
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === '/features'
                        ? pathname.startsWith('/features')
                        : item.href === '/authentication/accounts'
                          ? pathname.startsWith('/authentication')
                          : pathname === item.href
                    }
                    tooltip={item.title}
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/settings')}
                  tooltip="Settings"
                >
                  <Link to="/settings/project">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
