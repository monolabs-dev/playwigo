import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { mockProjects } from '#/features/dashboard/data/mock-projects.ts'
import type { DashboardProject } from '#/features/dashboard/types/project.ts'

const STORAGE_KEY = 'playwigo:selected-project'

type ActiveProjectContextValue = {
  projects: DashboardProject[]
  project: DashboardProject
  selectProject: (id: string) => void
  switcherOpen: boolean
  setSwitcherOpen: (open: boolean) => void
}

const ActiveProjectContext = createContext<ActiveProjectContextValue | null>(
  null,
)

function projectById(id: string | null) {
  return mockProjects.find((project) => project.id === id) ?? mockProjects[0]
}

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState(mockProjects[0].id)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const match = projectById(stored)
    setProjectId(match.id)
  }, [])

  const selectProject = useCallback((id: string) => {
    const match = projectById(id)
    setProjectId(match.id)
    localStorage.setItem(STORAGE_KEY, match.id)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) {
        return
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSwitcherOpen((open) => !open)
        return
      }

      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) {
        return
      }

      const index = Number(event.key) - 1
      if (index >= 0 && index < mockProjects.length) {
        event.preventDefault()
        selectProject(mockProjects[index].id)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectProject])

  const project = projectById(projectId)

  const value = useMemo<ActiveProjectContextValue>(
    () => ({
      projects: mockProjects,
      project,
      selectProject,
      switcherOpen,
      setSwitcherOpen,
    }),
    [project, selectProject, switcherOpen],
  )

  return <ActiveProjectContext value={value}>{children}</ActiveProjectContext>
}

export function useActiveProject() {
  const context = use(ActiveProjectContext)

  if (!context) {
    throw new Error(
      'useActiveProject must be used within ActiveProjectProvider',
    )
  }

  return context
}
