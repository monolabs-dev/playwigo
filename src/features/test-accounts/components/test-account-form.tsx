import { useState  } from 'react'
import type {ReactNode} from 'react';
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '#/components/ui/button.tsx'
import { TestAccountField } from '#/features/test-accounts/components/test-account-field.tsx'
import {
  createTestAccount,
  updateTestAccountFn,
} from '#/features/test-accounts/server/test-accounts.ts'
import {
  createTestAccountSchema,
  testAccountFormSchema,
  updateTestAccountSchema,
} from '#/features/test-accounts/schemas/test-account.ts'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

type TestAccountFormValues = {
  name: string
  description: string
  email: string
  password: string
  url: string
}

function toFormValues(
  account: TestAccountSummary | undefined,
  projectWebsite: string,
): TestAccountFormValues {
  return {
    name: account?.name ?? '',
    description: account?.description ?? '',
    email: account?.email ?? '',
    password: '',
    url: account?.url ?? projectWebsite,
  }
}

export function TestAccountForm({
  formId = 'test-account-form',
  mode,
  projectId,
  projectWebsite,
  account,
  submitLabel,
  submittingLabel,
  submitClassName,
  children,
  onSubmitted,
}: {
  formId?: string
  mode: 'create' | 'edit'
  projectId: string
  projectWebsite: string
  account?: TestAccountSummary
  submitLabel?: string
  submittingLabel?: string
  submitClassName?: string
  children?: (state: { isSubmitting: boolean }) => ReactNode
  onSubmitted: (account: TestAccountSummary) => void | Promise<void>
}) {
  const router = useRouter()
  const createFn = useServerFn(createTestAccount)
  const updateFn = useServerFn(updateTestAccountFn)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: toFormValues(account, projectWebsite),
    validators: {
      onSubmit: testAccountFormSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        if (mode === 'create') {
          const payload = createTestAccountSchema.parse({
            projectId,
            ...value,
          })
          const saved = await createFn({ data: payload })
          await onSubmitted(saved)
          await router.invalidate({ sync: true })
          return
        }

        const payload = updateTestAccountSchema.parse({
          id: account!.id,
          ...value,
        })
        const saved = await updateFn({ data: payload })

        await onSubmitted(saved)
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to save test account. Try again.',
        )
      }
    },
  })

  const resolvedSubmitLabel =
    submitLabel ?? (mode === 'create' ? 'Add account' : 'Save changes')
  const resolvedSubmittingLabel =
    submittingLabel ??
    (mode === 'create' ? 'Adding account…' : 'Saving changes…')

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
            <TestAccountField
              label="Account name"
              name={field.name}
              autoFocus
              placeholder="Admin user"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              hint="A label your team will recognize during test runs."
            />
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <TestAccountField
              label="Email"
              name={field.name}
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <TestAccountField
              label="Password"
              name={field.name}
              type="password"
              autoComplete="new-password"
              placeholder={
                mode === 'edit' ? 'Leave blank to keep current password' : ''
              }
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="url">
          {(field) => (
            <TestAccountField
              label="Login URL"
              name={field.name}
              inputMode="url"
              placeholder="app.example.com/login"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <TestAccountField
              label="Notes"
              name={field.name}
              kind="textarea"
              placeholder="Used for checkout flows in staging."
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
