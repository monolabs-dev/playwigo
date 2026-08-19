import { useState  } from 'react'
import type {ReactNode} from 'react';
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '#/components/ui/button.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { TestCaseField } from '#/features/test-cases/components/test-case-field.tsx'
import {
  createTestCase,
  updateTestCaseFn,
} from '#/features/test-cases/server/test-cases.ts'
import {
  createTestCaseSchema,
  testCaseFormSchema,
  updateTestCaseSchema,
} from '#/features/test-cases/schemas/test-case.ts'
import type { TestCaseSummary } from '#/features/test-cases/types/test-case.ts'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

type TestCaseFormValues = {
  name: string
  baseUrl: string
  testAccountId: string
}

function toFormValues(
  testCase: TestCaseSummary | undefined,
  defaultBaseUrl: string,
): TestCaseFormValues {
  return {
    name: testCase?.name ?? '',
    baseUrl: testCase?.baseUrl ?? defaultBaseUrl,
    testAccountId: testCase?.testAccountId ?? '',
  }
}

export function TestCaseForm({
  formId = 'test-case-form',
  mode,
  featureId,
  defaultBaseUrl,
  testAccounts,
  testCase,
  submitLabel,
  submittingLabel,
  submitClassName,
  children,
  onSubmitted,
}: {
  formId?: string
  mode: 'create' | 'edit'
  featureId: string
  defaultBaseUrl: string
  testAccounts: TestAccountSummary[]
  testCase?: TestCaseSummary
  submitLabel?: string
  submittingLabel?: string
  submitClassName?: string
  children?: (state: { isSubmitting: boolean }) => ReactNode
  onSubmitted: (testCase: TestCaseSummary) => void | Promise<void>
}) {
  const router = useRouter()
  const createFn = useServerFn(createTestCase)
  const updateFn = useServerFn(updateTestCaseFn)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: toFormValues(testCase, defaultBaseUrl),
    validators: {
      onSubmit: testCaseFormSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        if (mode === 'create') {
          const payload = createTestCaseSchema.parse({
            featureId,
            ...value,
          })
          const saved = await createFn({ data: payload })
          await onSubmitted(saved)
          await router.invalidate({ sync: true })
          return
        }

        const payload = updateTestCaseSchema.parse({
          id: testCase!.id,
          ...value,
        })
        const saved = await updateFn({ data: payload })

        await onSubmitted(saved)
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to save test case. Try again.',
        )
      }
    },
  })

  const resolvedSubmitLabel =
    submitLabel ?? (mode === 'create' ? 'Add test case' : 'Save changes')
  const resolvedSubmittingLabel =
    submittingLabel ??
    (mode === 'create' ? 'Adding test case…' : 'Saving changes…')

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
            <TestCaseField
              label="Test case name"
              name={field.name}
              autoFocus
              placeholder="User can complete checkout"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="baseUrl">
          {(field) => (
            <TestCaseField
              label="Base URL"
              name={field.name}
              inputMode="url"
              placeholder="app.example.com/checkout"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="testAccountId">
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Test account</Label>
              <Select
                value={field.state.value || 'none'}
                onValueChange={(value) =>
                  field.handleChange(value === 'none' ? '' : value)
                }
              >
                <SelectTrigger
                  id={field.name}
                  className="h-11 w-full rounded-xl px-3"
                >
                  <SelectValue placeholder="No account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No account</SelectItem>
                  {testAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
