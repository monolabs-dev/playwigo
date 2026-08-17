import { Button } from '#/components/ui/button.tsx'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { CreateProjectForm } from '#/features/projects/components/create-project-form.tsx'
import type { Project } from '#/features/projects/types/project.ts'

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (project: Project) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Name the project and the site you want to test.
          </DialogDescription>
        </DialogHeader>
        <CreateProjectForm
          onCreated={(project) => {
            onCreated(project)
            onOpenChange(false)
          }}
        >
          {({ isSubmitting }) => (
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="create-project-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating…' : 'Create project'}
              </Button>
            </DialogFooter>
          )}
        </CreateProjectForm>
      </DialogContent>
    </Dialog>
  )
}
