import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

import { Button } from '#/components/ui/button.tsx'
import { authClient } from '#/lib/auth-client.ts'
import { AuthField } from '#/features/auth/components/auth-field.tsx'
import {
  AuthLayout,
  authCtaClass,
} from '#/features/auth/components/auth-layout.tsx'
import {
  AuthDivider,
  GoogleSignInButton,
} from '#/features/auth/components/google-sign-in-button.tsx'
import { signUpSchema } from '#/features/auth/schemas/credentials.ts'
import {
  getAuthErrorMessage,
  getOAuthErrorMessage,
} from '#/features/auth/utils/auth-error.ts'
import { DEFAULT_POST_AUTH_PATH } from '#/features/auth/utils/safe-redirect.ts'

export function SignUpPage({
  redirectTo,
  oauthError,
}: {
  redirectTo: string
  oauthError?: string
}) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(
    getOAuthErrorMessage(oauthError),
  )

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        const result = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        })

        if (result.error) {
          setError(getAuthErrorMessage(result.error))
          return
        }

        await navigate({ href: redirectTo })
      } catch (caught) {
        setError(
          getAuthErrorMessage(caught, 'Unable to reach the server. Try again.'),
        )
      }
    },
  })

  return (
    <AuthLayout
      kicker="Playwright on the go"
      title="Create your account"
      description="Start automating your tests in minutes."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            search={{
              redirect:
                redirectTo === DEFAULT_POST_AUTH_PATH ? undefined : redirectTo,
            }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleSignInButton
        callbackURL={redirectTo}
        errorCallbackURL="/register"
        onError={(message) => setError(message || null)}
      />
      <AuthDivider />

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field name="name">
          {(field) => (
            <AuthField
              label="Name"
              name={field.name}
              type="text"
              autoComplete="name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>
        <form.Field name="email">
          {(field) => (
            <AuthField
              label="Email"
              name={field.name}
              type="email"
              autoComplete="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <AuthField
              label="Password"
              name={field.name}
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              hint="At least 8 characters."
            />
          )}
        </form.Field>
        <form.Field name="confirmPassword">
          {(field) => (
            <AuthField
              label="Confirm password"
              name={field.name}
              type="password"
              autoComplete="new-password"
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
            <Button
              type="submit"
              className={authCtaClass}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account…' : 'Get Started'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthLayout>
  )
}
