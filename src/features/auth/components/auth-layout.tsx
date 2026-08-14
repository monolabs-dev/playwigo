import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BugPlay } from 'lucide-react'

import { ModeToggle } from '#/components/mode-toggle.tsx'
import { PageShell } from '#/components/page-shell.tsx'

export const authCtaClass =
  'h-11 w-full rounded-full text-[15px] transition-[transform,background-color,box-shadow,color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-0 active:scale-[0.97]'

export function AuthLayout({
  kicker,
  title,
  description,
  children,
  footer,
}: {
  kicker: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
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
        <p className="animate-lp-enter font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
          {kicker}
        </p>
        <h1 className="animate-lp-enter mt-3 font-display text-4xl font-semibold tracking-tight delay-75">
          {title}
        </h1>
        <p className="animate-lp-enter mt-2 text-sm text-muted-foreground delay-100">
          {description}
        </p>
        <div className="animate-lp-enter mt-8 delay-150">{children}</div>
        <div className="animate-lp-enter mt-6 delay-200">{footer}</div>
      </main>
    </PageShell>
  )
}
