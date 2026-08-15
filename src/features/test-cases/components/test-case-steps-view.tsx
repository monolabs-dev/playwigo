import { CheckCircle2, ImageOff } from 'lucide-react'

import { formatSelector } from '#/features/test-cases/utils/step-actions.ts'
import { cn } from '#/lib/utils.ts'

export type TestCaseStepViewItem = {
  id: string
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  screenshotUrl: string | null
}

function displayText(value: string | null) {
  return value && value.length > 0 ? value : '—'
}

function StepMeta({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'truncate text-sm text-foreground',
          mono && 'font-mono text-xs',
        )}
        title={value === '—' ? undefined : value}
      >
        {value}
      </p>
    </div>
  )
}

export function TestCaseStepsView({
  steps,
}: {
  steps: TestCaseStepViewItem[]
}) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-10 text-center">
        <p className="text-sm font-medium">No steps yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Switch to Editor to add the first step.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {steps.length} {steps.length === 1 ? 'step' : 'steps'}
      </p>

      <ol className="relative space-y-3">
        <div
          aria-hidden
          className="absolute top-2.5 bottom-2.5 left-2.5 w-px bg-border"
        />
        {steps.map((step) => {
          const selector = formatSelector(step.selectorType, step.selector)

          return (
            <li key={step.id} className="relative flex items-start gap-3">
              <CheckCircle2
                className="relative z-10 mt-3 size-5 shrink-0 rounded-full bg-popover text-emerald-500"
                aria-hidden
              />
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_3.25rem] items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
                <StepMeta label="Action" value={step.action} mono />
                <StepMeta label="Selector" value={displayText(selector)} mono />
                <StepMeta label="Value" value={displayText(step.value)} />
                <div className="overflow-hidden rounded-md border bg-muted">
                  {step.screenshotUrl ? (
                    <img
                      src={step.screenshotUrl}
                      alt=""
                      className="size-12 object-cover"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center text-muted-foreground/60">
                      <ImageOff className="size-3.5" aria-hidden />
                      <span className="sr-only">No screenshot</span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
