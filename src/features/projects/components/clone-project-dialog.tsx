import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

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
import { Label } from '#/components/ui/label.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import { ProjectField } from '#/features/projects/components/project-field.tsx'
import { cloneProject } from '#/features/projects/server/projects.ts'
import { cloneProjectSchema } from '#/features/projects/schemas/project.ts'
import { websiteHost } from '#/features/dashboard/utils/project-display.ts'
import type { Project } from '#/features/projects/types/project.ts'

export function CloneProjectDialog({
  project,
  open,
  onOpenChange,
  onCloned,
}: {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onCloned: (project: Project) => void
}) {
  const router = useRouter()
  const cloneFn = useServerFn(cloneProject)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: '',
      website: '',
      replaceUrls: true,
    },
    validators: {
      onSubmit: cloneProjectSchema.omit({ sourceId: true }),
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        const payload = cloneProjectSchema.parse({
          sourceId: project.id,
          ...value,
        })
        const cloned = await cloneFn({ data: payload })
        onCloned(cloned)
        onOpenChange(false)
        form.reset()
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to clone project. Try again.',
        )
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset()
          setError(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clone project</DialogTitle>
          <DialogDescription>
            Copy all features, test accounts, login flow, and test cases from
            “{project.name}”. Run history is not copied.
          </DialogDescription>
        </DialogHeader>

        <form
          id="clone-project-form"
          method="post"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field name="name">
            {(field) => (
              <ProjectField
                label="New project name"
                name={field.name}
                autoFocus
                placeholder={`Copy of ${project.name}`}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                errors={field.state.meta.errors}
              />
            )}
          </form.Field>

          <form.Field name="website">
            {(field) => (
              <ProjectField
                label="Website"
                name={field.name}
                placeholder={websiteHost(project.website)}
                inputMode="url"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                errors={field.state.meta.errors}
              />
            )}
          </form.Field>

          <form.Field name="replaceUrls">
            {(field) => (
              <div className="flex items-start justify-between gap-4 rounded-xl border px-4 py-3">
                <div className="space-y-1">
                  <Label htmlFor="replace-urls">Replace URLs</Label>
                  <p className="text-xs text-muted-foreground">
                    Swap {websiteHost(project.website)} with the new website in
                    test accounts, base URLs, and step values.
                  </p>
                </div>
                <Switch
                  id="replace-urls"
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="clone-project-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cloning…' : 'Clone project'}
              </Button>
            </DialogFooter>
          )}
        </form.Subscribe>
      </DialogContent>
    </Dialog>
  )
}
