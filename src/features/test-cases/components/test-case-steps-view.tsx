import { useState } from 'react'
import { Check, ImageOff, Loader2, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { formatSelector } from '#/features/test-cases/utils/step-actions.ts'
import type { TestRunStepStatus } from '#/features/test-cases/types/test-case.ts'
import { cn } from '#/lib/utils.ts'

export type TestCaseStepViewItem = {
  id: string
  stepNumber: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  screenshotUrl: string | null
  runStatus: TestRunStepStatus | null
  errorMessage: string | null
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

function StepIndicator({
  stepNumber,
  runStatus,
  hasRun,
}: {
  stepNumber: number
  runStatus: TestRunStepStatus | null
  hasRun: boolean
}) {
  if (!hasRun || !runStatus) {
    return (
      <span className="relative z-10 mt-3 flex size-5 shrink-0 items-center justify-center rounded-full border bg-popover text-[11px] font-medium tabular-nums text-muted-foreground">
        {stepNumber}
      </span>
    )
  }

  if (runStatus === 'running') {
    return (
      <span className="relative z-10 mt-3 flex size-5 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-primary">
        <Loader2 className="size-3 animate-spin" aria-hidden />
      </span>
    )
  }

  if (runStatus === 'passed') {
    return (
      <span className="relative z-10 mt-3 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" strokeWidth={2.5} aria-hidden />
      </span>
    )
  }

  if (runStatus === 'failed') {
    return (
      <span className="relative z-10 mt-3 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <X className="size-3" strokeWidth={2.5} aria-hidden />
      </span>
    )
  }

  return (
    <span className="relative z-10 mt-3 flex size-5 shrink-0 items-center justify-center rounded-full border bg-popover text-[11px] font-medium tabular-nums text-muted-foreground">
      {stepNumber}
    </span>
  )
}

function StepScreenshot({
  screenshotUrl,
  stepNumber,
  onOpen,
}: {
  screenshotUrl: string
  stepNumber: number
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-md border bg-muted transition hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`View screenshot for step ${stepNumber}`}
    >
      <img
        src={screenshotUrl}
        alt={`Screenshot for step ${stepNumber}`}
        className="size-12 object-cover transition group-hover:scale-105"
      />
    </button>
  )
}

function ScreenshotLightbox({
  screenshotUrl,
  stepNumber,
  open,
  onOpenChange,
}: {
  screenshotUrl: string | null
  stepNumber: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!screenshotUrl || stepNumber === null) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] max-w-[min(96vw,72rem)] gap-0 overflow-hidden border-0 bg-black/95 p-0 ring-0 sm:max-w-[min(96vw,72rem)]"
        showCloseButton
      >
        <DialogTitle className="sr-only">
          Screenshot for step {stepNumber}
        </DialogTitle>
        <div className="flex max-h-[calc(100vh-2rem)] items-center justify-center p-3 pt-10">
          <img
            src={screenshotUrl}
            alt={`Screenshot for step ${stepNumber}`}
            className="max-h-[calc(100vh-5rem)] w-auto max-w-full rounded-md object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TestCaseStepsView({
  steps,
  hasRun,
}: {
  steps: TestCaseStepViewItem[]
  hasRun: boolean
}) {
  const [lightbox, setLightbox] = useState<{
    screenshotUrl: string
    stepNumber: number
  } | null>(null)

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
    <>
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
            const showScreenshot = Boolean(step.screenshotUrl)
            const showError =
              hasRun &&
              step.runStatus === 'failed' &&
              Boolean(step.errorMessage)

            return (
              <li key={step.id} className="relative flex items-start gap-3">
                <StepIndicator
                  stepNumber={step.stepNumber}
                  runStatus={step.runStatus}
                  hasRun={hasRun}
                />
                <div className="min-w-0 flex-1 rounded-xl border bg-card">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_3.25rem] items-center gap-3 px-3 py-2.5">
                    <StepMeta label="Action" value={step.action} mono />
                    <StepMeta
                      label="Selector"
                      value={displayText(selector)}
                      mono
                    />
                    <StepMeta label="Value" value={displayText(step.value)} />
                    <div>
                      {showScreenshot ? (
                        <StepScreenshot
                          screenshotUrl={step.screenshotUrl!}
                          stepNumber={step.stepNumber}
                          onOpen={() =>
                            setLightbox({
                              screenshotUrl: step.screenshotUrl!,
                              stepNumber: step.stepNumber,
                            })
                          }
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-md border bg-muted text-muted-foreground/60">
                          <ImageOff className="size-3.5" aria-hidden />
                          <span className="sr-only">No screenshot</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {showError ? (
                    <div className="border-t bg-destructive/5 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-destructive">
                        Error
                      </p>
                      <p className="mt-0.5 text-sm text-destructive/90">
                        {step.errorMessage}
                      </p>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <ScreenshotLightbox
        screenshotUrl={lightbox?.screenshotUrl ?? null}
        stepNumber={lightbox?.stepNumber ?? null}
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLightbox(null)
          }
        }}
      />
    </>
  )
}
