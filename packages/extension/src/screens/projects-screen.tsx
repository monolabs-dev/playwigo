import { useQuery } from '@tanstack/react-query'
import { ChevronRight, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

import { createClient, listProjects, webAppUrl } from '@/api/client'
import { DEFAULT_API_URL, type Project } from '@/api/types'
import { AppHeader, ExternalLinkButton } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { getAuth } from '@/lib/storage'
import { projectFaviconUrl } from '@/lib/utils'

type ProjectsScreenProps = {
  onSelect: (project: Project) => void
  onSignOut: () => void
}

export function ProjectsScreen({ onSelect, onSignOut }: ProjectsScreenProps) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)

  useEffect(() => {
    void getAuth().then((auth) => {
      if (auth?.apiUrl) setApiUrl(auth.apiUrl)
    })
  }, [])

  const query = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const auth = await getAuth()
      if (!auth) throw new Error('Not signed in')
      return listProjects(createClient(auth.apiKey, auth.apiUrl))
    },
  })

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        title="Projects"
        subtitle="Select a project to record"
        actions={
          <>
            <ExternalLinkButton href={webAppUrl(apiUrl)} label="Manage" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <LogOut />
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Loading projects…
          </p>
        ) : query.isError ? (
          <p className="px-3 py-6 text-center text-xs text-destructive">
            {(query.error as Error).message}
          </p>
        ) : query.data?.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No projects yet. Create one in the Playwigo web app.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {query.data?.map((project) => {
              const favicon = projectFaviconUrl(project.website)
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/60"
                    onClick={() => onSelect(project)}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                      {favicon ? (
                        <img
                          src={favicon}
                          alt=""
                          className="size-4"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold">
                          {project.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {project.name}
                      </span>
                      {project.website ? (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {project.website}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
