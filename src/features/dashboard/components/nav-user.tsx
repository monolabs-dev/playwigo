import { useNavigate } from '@tanstack/react-router'
import {
  ChevronsUpDown,
  LogOut,
  Monitor,
  Moon,
  Route,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar.tsx'
import { useTheme } from '#/components/theme-provider.tsx'
import { authClient } from '#/lib/auth-client.ts'
import { useProductTour } from '#/features/dashboard/hooks/product-tour.tsx'
import { comingSoon } from '#/features/dashboard/utils/coming-soon.ts'

export function NavUser({
  user,
}: {
  user: { id: string; name: string; email: string; image?: string | null }
}) {
  const { isMobile } = useSidebar()
  const { setTheme } = useTheme()
  const { startTour } = useProductTour()
  const navigate = useNavigate()
  const initial = user.name.charAt(0).toUpperCase() || 'U'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              tooltip={user.name}
            >
              <Avatar size="sm" className="size-8 rounded-lg">
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-xl"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => comingSoon('Account')}>
                <UserRound />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void navigate({ to: '/settings/api-keys' })
                }}
              >
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => startTour()}>
                <Route />
                Replay tour
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="size-4" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => setTheme('light')}>
                    <Sun />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTheme('dark')}>
                    <Moon />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setTheme('system')}>
                    <Monitor />
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                void authClient.signOut().then(() => navigate({ to: '/' }))
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
