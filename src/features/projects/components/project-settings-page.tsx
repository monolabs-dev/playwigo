import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { ProjectMark } from '#/features/dashboard/components/project-mark.tsx'
import { websiteHost } from '#/features/dashboard/utils/project-display.ts'
import { DeleteProjectDialog } from '#/features/projects/components/delete-project-dialog.tsx'
import { ProjectSettingsForm } from '#/features/projects/components/project-settings-form.tsx'

export function ProjectSettingsPage() {
  const { project, projects, selectProject } = useActiveProject()
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Project</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage the name and website for{' '}
          <span className="text-foreground">{project.name}</span>.
        </p>
      </section>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <ProjectMark
              id={project.id}
              name={project.name}
              website={project.website}
              className="size-10 text-sm"
            />
            <div className="min-w-0">
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{websiteHost(project.website)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ProjectSettingsForm
            key={`${project.id}:${project.name}:${project.website}`}
            project={project}
            onUpdated={(saved) => {
              toast.success('Project updated', {
                description: saved.name,
              })
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting this project removes all related data. This cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete project
          </Button>
        </CardContent>
      </Card>

      <DeleteProjectDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={(deleted) => {
          const remaining = projects.filter((item) => item.id !== deleted.id)
          const next = remaining[0]
          if (next) {
            selectProject(next.id)
          }

          toast.success('Project deleted', {
            description: deleted.name,
          })
        }}
      />
    </div>
  )
}
