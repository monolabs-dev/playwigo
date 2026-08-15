import { useState, type ReactNode } from 'react'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '#/components/ui/button.tsx'
import { FeatureField } from '#/features/features/components/feature-field.tsx'
import {
  createFeature,
  updateFeatureFn,
} from '#/features/features/server/features.ts'
import {
  createFeatureSchema,
  featureFormSchema,
  updateFeatureSchema,
} from '#/features/features/schemas/feature.ts'
import type { FeatureSummary } from '#/features/features/types/feature.ts'

type FeatureFormValues = {
  name: string
  description: string
}

function toFormValues(feature: FeatureSummary | undefined): FeatureFormValues {
  return {
    name: feature?.name ?? '',
    description: feature?.description ?? '',
  }
}

export function FeatureForm({
  formId = 'feature-form',
  mode,
  projectId,
  feature,
  submitLabel,
  submittingLabel,
  submitClassName,
  children,
  onSubmitted,
}: {
  formId?: string
  mode: 'create' | 'edit'
  projectId: string
  feature?: FeatureSummary
  submitLabel?: string
  submittingLabel?: string
  submitClassName?: string
  children?: (state: { isSubmitting: boolean }) => ReactNode
  onSubmitted: (feature: FeatureSummary) => void | Promise<void>
}) {
  const router = useRouter()
  const createFn = useServerFn(createFeature)
  const updateFn = useServerFn(updateFeatureFn)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: toFormValues(feature),
    validators: {
      onSubmit: featureFormSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        if (mode === 'create') {
          const payload = createFeatureSchema.parse({
            projectId,
            ...value,
          })
          const saved = await createFn({ data: payload })
          await onSubmitted(saved)
          await router.invalidate({ sync: true })
          return
        }

        const payload = updateFeatureSchema.parse({
          id: feature!.id,
          ...value,
        })
        const saved = await updateFn({ data: payload })

        await onSubmitted(saved)
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to save feature. Try again.',
        )
      }
    },
  })

  const resolvedSubmitLabel =
    submitLabel ?? (mode === 'create' ? 'Add feature' : 'Save changes')
  const resolvedSubmittingLabel =
    submittingLabel ??
    (mode === 'create' ? 'Adding feature…' : 'Saving changes…')

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
            <FeatureField
              label="Feature name"
              name={field.name}
              autoFocus
              placeholder="Checkout"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              hint="Group related test cases by product area."
            />
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <FeatureField
              label="Description"
              name={field.name}
              kind="textarea"
              placeholder="Payment flows, cart, and order confirmation."
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
                {isSubmitting ? resolvedSubmittingLabel : resolvedSubmitLabel}
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
