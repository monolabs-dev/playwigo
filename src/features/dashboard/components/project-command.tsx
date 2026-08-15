import { FolderPlus } from 'lucide-react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '#/components/ui/command.tsx'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { ProjectMark } from '#/features/dashboard/components/project-mark.tsx'
import { websiteHost } from '#/features/dashboard/utils/project-display.ts'

export function ProjectCommand() {
  const {
    projects,
    project,
    selectProject,
    switcherOpen,
    setSwitcherOpen,
    setCreateOpen,
  } = useActiveProject()

  return (
    <CommandDialog
      open={switcherOpen}
      onOpenChange={setSwitcherOpen}
      title="Switch project"
      description="Search and switch between projects"
    >
      <Command>
        <CommandInput placeholder="Search projects…" />
        <CommandList>
          <CommandEmpty>No project matches that search.</CommandEmpty>
          <CommandGroup heading="Projects">
            {projects.map((item, index) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.website}`}
                data-checked={item.id === project.id}
                onSelect={() => {
                  selectProject(item.id)
                  setSwitcherOpen(false)
                }}
              >
                <ProjectMark
                  id={item.id}
                  name={item.name}
                  website={item.website}
                />
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate">{item.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {websiteHost(item.website)}
                  </span>
                </span>
                {item.id === project.id || index >= 9 ? null : (
                  <CommandShortcut>⌘{index + 1}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              value="create new project"
              onSelect={() => {
                setSwitcherOpen(false)
                window.setTimeout(() => setCreateOpen(true), 100)
              }}
            >
              <FolderPlus />
              Create project
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
