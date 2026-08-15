import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import type { Project } from '#/features/projects/types/project.ts'
import { SELECTED_PROJECT_STORAGE_KEY } from '#/features/projects/utils/selected-project.ts'

type ActiveProjectContextValue = {
  projects: Project[]
  project: Project
  selectProject: (id: string) => void
  switcherOpen: boolean
  setSwitcherOpen: (open: boolean) => void
  createOpen: boolean
  setCreateOpen: (open: boolean) => void
}

const ActiveProjectContext = createContext<ActiveProjectContextValue | null>(
  null,
)

function resolveProject(projects: Project[], id: string | null) {
  return projects.find((project) => project.id === id) ?? projects[0]
}

export function ActiveProjectProvider({
  projects,
  children,
}: {
  projects: Project[]
  children: ReactNode
}) {
  const initial = projects[0]

  if (!initial) {
    throw new Error('ActiveProjectProvider requires at least one project')
  }

  const [projectId, setProjectId] = useState(initial.id)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)
    const match = resolveProject(projects, stored)
    setProjectId(match.id)

    if (match.id !== stored) {
      localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, match.id)
    }
  }, [projects])

  const selectProject = useCallback((id: string) => {
    setProjectId(id)
    localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, id)
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
      const next = projects[index]
      if (next) {
        event.preventDefault()
        selectProject(next.id)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [projects, selectProject])

  const project = resolveProject(projects, projectId)

  const value = useMemo<ActiveProjectContextValue>(
    () => ({
      projects,
      project,
      selectProject,
      switcherOpen,
      setSwitcherOpen,
      createOpen,
      setCreateOpen,
    }),
    [projects, project, selectProject, switcherOpen, createOpen],
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
