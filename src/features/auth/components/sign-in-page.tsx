import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { BugPlay } from 'lucide-react'

import { ModeToggle } from '#/components/mode-toggle.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { PageShell } from '#/components/page-shell.tsx'
import { authClient } from '#/lib/auth-client.ts'

const ctaClass =
  'h-11 w-full rounded-full text-[15px] transition-[transform,background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-0 active:scale-[0.97]'

export function SignInPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '')

    const result =
      mode === 'signup'
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

    setPending(false)

    if (result.error) {
      setError(result.error.message ?? 'Something went wrong. Try again.')
      return
    }

    await navigate({ to: '/' })
  }

  return (
    <PageShell>
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-heading text-sm font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BugPlay className="size-4" />
          </span>
          Playwigo
        </Link>
        <ModeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
          Playwright on the go
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'signin'
            ? 'Sign in to organize projects, features, and test runs.'
            : 'Start automating your tests in minutes.'}
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {mode === 'signup' ? (
            <Field label="Name" name="name" type="text" autoComplete="name" />
          ) : null}
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={
              mode === 'signup' ? 'new-password' : 'current-password'
            }
          />

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className={ctaClass} disabled={pending}>
            {pending
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign In'
                : 'Get Started'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </main>
    </PageShell>
  )
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string
  name: string
  type: string
  autoComplete: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="h-11 rounded-xl px-3"
      />
    </div>
  )
}
