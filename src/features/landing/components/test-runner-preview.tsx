import { Check, Circle } from 'lucide-react'

const tests = [
  {
    name: 'should render the cart with two items',
    duration: '184ms',
    status: 'passed',
  },
  {
    name: 'should apply promo code SAVE20',
    duration: '261ms',
    status: 'passed',
  },
  {
    name: 'should calculate tax for a US address',
    duration: '412ms',
    status: 'passed',
  },
  {
    name: 'should submit the order and show confirmation',
    duration: '—',
    status: 'running',
  },
] as const

const projects = [
  { name: 'Storefront', active: true },
  { name: 'Auth', active: false },
  { name: 'Billing', active: false },
]

const features = [
  { name: 'Checkout flow', active: true },
  { name: 'Cart drawer', active: false },
  { name: 'Order confirmation', active: false },
]

export function TestRunnerPreview() {
  return (
    <div className="animate-lp-preview relative delay-200">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -inset-y-10 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_68%)]"
      />

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-[0_24px_80px_-32px_oklch(0.2_0.04_50/0.45)] backdrop-blur-sm dark:bg-card/60">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </div>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
            playwigo / storefront / checkout.spec.ts
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-primary uppercase">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Live
          </span>
        </div>

        <div className="grid min-h-[22rem] md:grid-cols-[13.5rem_1fr]">
          <aside className="hidden border-r border-border/70 p-3 md:block">
            <p className="px-2 pt-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Projects
            </p>
            <ul className="mt-2 space-y-0.5">
              {projects.map((project) => (
                <li
                  key={project.name}
                  className={
                    project.active
                      ? 'rounded-md bg-primary/10 px-2 py-1.5 text-[13px] font-medium text-foreground'
                      : 'rounded-md px-2 py-1.5 text-[13px] text-muted-foreground'
                  }
                >
                  {project.name}
                </li>
              ))}
            </ul>
            <p className="mt-5 px-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Features
            </p>
            <ul className="mt-2 space-y-0.5">
              {features.map((feature) => (
                <li
                  key={feature.name}
                  className={
                    feature.active
                      ? 'rounded-md bg-foreground/5 px-2 py-1.5 text-[13px] font-medium text-foreground'
                      : 'rounded-md px-2 py-1.5 text-[13px] text-muted-foreground'
                  }
                >
                  {feature.name}
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex flex-col">
            <div className="flex items-end justify-between gap-4 border-b border-border/70 px-4 py-3 sm:px-5">
              <div>
                <p className="font-heading text-sm font-medium">
                  Checkout flow
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  4 tests · 3 passed · 1 running
                </p>
              </div>
              <p className="hidden font-mono text-[11px] text-muted-foreground sm:block">
                2.1s
              </p>
            </div>

            <ul className="divide-y divide-border/60">
              {tests.map((test, index) => (
                <li
                  key={test.name}
                  className="animate-lp-enter flex items-center gap-3 px-4 py-3 sm:px-5"
                  style={{ animationDelay: `${280 + index * 70}ms` }}
                >
                  <StatusIcon status={test.status} />
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] sm:text-[13px]">
                    {test.name}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {test.duration}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: 'passed' | 'running' }) {
  if (status === 'running') {
    return (
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <Circle className="size-3.5 text-primary" />
        <span className="absolute size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
      </span>
    )
  }

  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
      <Check className="size-2.5" strokeWidth={3} />
    </span>
  )
}
