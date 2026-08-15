import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '#/components/ui/button.tsx'
import { ProjectField } from '#/features/projects/components/project-field.tsx'
import { updateProjectFn } from '#/features/projects/server/projects.ts'
import {
  createProjectSchema,
  updateProjectSchema,
} from '#/features/projects/schemas/project.ts'
import type { Project } from '#/features/projects/types/project.ts'

export function ProjectSettingsForm({
  project,
  onUpdated,
}: {
  project: Project
  onUpdated: (project: Project) => void | Promise<void>
}) {
  const router = useRouter()
  const updateFn = useServerFn(updateProjectFn)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: project.name,
      website: project.website,
    },
    validators: {
      onSubmit: createProjectSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        const payload = updateProjectSchema.parse({
          id: project.id,
          ...value,
        })
        const saved = await updateFn({ data: payload })
        await onUpdated(saved)
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to save project settings. Try again.',
        )
      }
    },
  })

  return (
    <form
      id="project-settings-form"
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
            label="Project name"
            name={field.name}
            placeholder="Acme Checkout"
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
            placeholder="example.com"
            inputMode="url"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            errors={field.state.meta.errors}
          />
        )}
      </form.Field>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
