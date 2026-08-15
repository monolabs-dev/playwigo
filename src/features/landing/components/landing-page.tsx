import { Link } from '@tanstack/react-router'
import { ArrowRight, BugPlay, CheckCircle2 } from 'lucide-react'

import { ModeToggle } from '#/components/mode-toggle.tsx'
import { Button } from '#/components/ui/button.tsx'
import { cn } from '#/lib/utils.ts'
import { features, steps } from '#/features/landing/content.ts'
import { TestRunnerPreview } from '#/features/landing/components/test-runner-preview.tsx'
import { PageShell } from '#/components/page-shell.tsx'
import {
  AuthHeaderActions,
  type HeaderSession,
} from '#/integrations/better-auth/header-user.tsx'

const ctaClass =
  'h-11 rounded-full px-5 text-[15px] transition-[transform,background-color,box-shadow,color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-0 active:scale-[0.97]'

export function LandingPage({ session }: { session: HeaderSession }) {
  return (
    <PageShell>
      <Header session={session} />

      <main>
        <Hero />
        <Features />
        <Workflow />
        <CallToAction />
      </main>

      <Footer />
    </PageShell>
  )
}

function Header({ session }: { session: HeaderSession }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 font-heading text-sm font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_40%,black)]">
            <BugPlay className="size-4" />
          </span>
          Playwigo
        </a>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a
            className="transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] fine-hover:text-foreground"
            href="#features"
          >
            Features
          </a>
          <a
            className="transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] fine-hover:text-foreground"
            href="#workflow"
          >
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <AuthHeaderActions initialSession={session} />
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section
      id="top"
      className="mx-auto w-full max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24 md:pt-28"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="animate-lp-enter inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary">
          <CheckCircle2 className="size-3.5" />
          Playwright on the go
        </div>

        <h1 className="animate-lp-enter mt-6 font-display text-[2.75rem] leading-[1.05] font-semibold tracking-tight text-balance delay-75 sm:text-6xl md:text-7xl">
          Test automation
          <span className="block text-primary font-stretch-[80%]">
            made simple.
          </span>
        </h1>

        <p className="animate-lp-enter mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty delay-100 sm:text-lg">
          Create, manage, and run Playwright test cases with ease. Organize your
          projects, track features, and automate your testing workflow.
        </p>

        <div className="animate-lp-enter mt-8 flex w-full flex-col items-center gap-3 delay-150 sm:w-auto sm:flex-row">
          <Button size="lg" className={ctaClass} asChild>
            <Link to="/register">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className={ctaClass} asChild>
            <a href="#features">See how it works</a>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-5xl md:mt-20">
        <TestRunnerPreview />
      </div>
    </section>
  )
}

function Features() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28"
    >
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
          Capabilities
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
          Everything you need to manage test automation
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Streamline your testing workflow with powerful features designed for
          modern teams.
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <article
              key={feature.title}
              className="bg-background p-7 transition-[background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] fine-hover:bg-primary/[0.04] sm:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-8 font-heading text-lg font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Workflow() {
  return (
    <section
      id="workflow"
      className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 md:pb-28"
    >
      <div className="rounded-3xl border border-border bg-foreground/[0.02] px-6 py-12 sm:px-10 md:px-14 md:py-16">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
            Workflow
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From capture to green, without the busywork
          </h2>
        </div>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <li key={step.number} className="relative">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-4 left-[2.25rem] hidden h-px w-[calc(100%-1rem)] bg-border md:block"
                />
              ) : null}
              <p className="relative font-display text-3xl font-medium text-primary font-stretch-[80%]">
                {step.number}
              </p>
              <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CallToAction() {
  return (
    <section
      id="start"
      className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 md:pb-28"
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 px-6 py-16 text-center sm:px-10 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_35%,transparent),transparent_70%)]"
        />
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Join Playwigo today and start automating your tests in minutes.
          </p>
          <Button size="lg" className={cn(ctaClass, 'mt-8')} asChild>
            <Link to="/register">
              Start Testing Now
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <BugPlay className="size-4 text-primary" />
          <span>Playwigo — Playwright on the go</span>
        </div>
        <p>© 2026 Playwigo. All rights reserved.</p>
      </div>
    </footer>
  )
}
