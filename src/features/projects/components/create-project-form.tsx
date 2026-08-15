import { useState  } from 'react'
import type {ReactNode} from 'react';
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '#/components/ui/button.tsx'
import { createProject } from '#/features/projects/server/projects.ts'
import { createProjectSchema } from '#/features/projects/schemas/project.ts'
import { ProjectField } from '#/features/projects/components/project-field.tsx'
import type { Project } from '#/features/projects/types/project.ts'

export function CreateProjectForm({
  formId = 'create-project-form',
  submitLabel = 'Create project',
  submittingLabel = 'Creating…',
  submitClassName,
  children,
  onCreated,
}: {
  formId?: string
  submitLabel?: string
  submittingLabel?: string
  submitClassName?: string
  children?: (state: { isSubmitting: boolean }) => ReactNode
  onCreated: (project: Project) => void | Promise<void>
}) {
  const router = useRouter()
  const createProjectFn = useServerFn(createProject)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: '',
      website: '',
    },
    validators: {
      onSubmit: createProjectSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        const project = await createProjectFn({ data: value })
        await onCreated(project)
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to create project. Try again.',
        )
      }
    },
  })

  return (
    <>
      <form
        id={formId}
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
              autoFocus
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

        {children ? null : (
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={isSubmitting}
                className={submitClassName}
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            )}
          </form.Subscribe>
        )}
      </form>

      {children ? (
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => children({ isSubmitting })}
        </form.Subscribe>
      ) : null}
    </>
  )
}
