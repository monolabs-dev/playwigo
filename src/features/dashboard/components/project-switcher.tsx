import { ChevronsUpDown, FolderPlus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar.tsx'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { ProjectMark } from '#/features/dashboard/components/project-mark.tsx'
import { comingSoon } from '#/features/dashboard/utils/coming-soon.ts'
import {
  healthDotClass,
  websiteHost,
} from '#/features/dashboard/utils/project-display.ts'

export function ProjectSwitcher() {
  const { isMobile } = useSidebar()
  const { projects, project, selectProject, setSwitcherOpen } =
    useActiveProject()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              tooltip={project.name}
            >
              <ProjectMark
                id={project.id}
                name={project.name}
                className="size-8 text-xs"
              />
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{project.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {websiteHost(project.website)}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 rounded-xl"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={8}
          >
            <DropdownMenuLabel className="flex items-center justify-between px-2">
              <span>Projects</span>
              <button
                type="button"
                className="rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
                onClick={() => setSwitcherOpen(true)}
              >
                ⌘K
              </button>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {projects.map((item, index) => (
                <DropdownMenuItem
                  key={item.id}
                  className="gap-2 py-2"
                  onSelect={() => selectProject(item.id)}
                >
                  <ProjectMark id={item.id} name={item.name} />
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="flex items-center gap-2 truncate">
                      {item.name}
                      <span
                        className={`size-1.5 rounded-full ${healthDotClass(item.health)}`}
                      />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {websiteHost(item.website)}
                    </span>
                  </span>
                  {item.id === project.id ? (
                    <span className="text-[11px] text-muted-foreground">
                      Current
                    </span>
                  ) : (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 py-2"
              onSelect={() => comingSoon('New project')}
            >
              <span className="flex size-6 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                <FolderPlus className="size-3.5" />
              </span>
              Create project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
