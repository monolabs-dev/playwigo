import { useState } from 'react'
import type { ReactNode } from 'react'
import { Ban, Check, ImageOff, Loader2, LogIn, X } from 'lucide-react'

import { Badge } from '#/components/ui/badge.tsx'
import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog.tsx'
import { formatSelector } from '#/features/test-cases/utils/step-actions.ts'
import type {
  TestCaseLoginPrelude,
  TestRunStepStatus,
} from '#/features/test-cases/types/test-case.ts'
import { cn } from '#/lib/utils.ts'

export type TestCaseStepViewItem = {
  id: string
  stepNumber: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  resolvedValue?: string | null
  outputVariable?: string | null
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

function loginPreludeStatusLabel(status: TestRunStepStatus | null) {
  switch (status) {
    case 'running':
      return 'Running login'
    case 'passed':
      return 'Login complete'
    case 'failed':
      return 'Login failed'
    case 'cancelled':
      return 'Login cancelled'
    case 'pending':
      return 'Login pending'
    default:
      return null
  }
}

function LoginPreludeRow({
  loginPrelude,
  hasRun,
}: {
  loginPrelude: TestCaseLoginPrelude
  hasRun: boolean
}) {
  const showStatus = hasRun && loginPrelude.runStatus !== null
  const statusLabel = loginPreludeStatusLabel(loginPrelude.runStatus)
  const accountLabel = loginPrelude.testAccountName ?? 'test account'

  return (
    <li className="relative flex items-start gap-3">
      <StepIndicator
        stepNumber={0}
        runStatus={showStatus ? loginPrelude.runStatus : null}
        hasRun={showStatus}
        icon={<LogIn className="size-3" aria-hidden />}
      />
      <div className="min-w-0 flex-1 rounded-xl border border-dashed bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">
                {loginPrelude.loginFlowName}
              </p>
              <Badge
                variant="secondary"
                className="text-[10px] uppercase tracking-wide"
              >
                Login
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Runs before test steps using {accountLabel}
              {loginPrelude.stepCount > 0
                ? ` · ${loginPrelude.stepCount} ${loginPrelude.stepCount === 1 ? 'step' : 'steps'}`
                : ''}
            </p>
          </div>
          {statusLabel ? (
            <p
              className={cn(
                'text-xs font-medium',
                loginPrelude.runStatus === 'running' && 'text-primary',
                loginPrelude.runStatus === 'passed' &&
                  'text-emerald-600 dark:text-emerald-400',
                loginPrelude.runStatus === 'failed' && 'text-destructive',
                loginPrelude.runStatus === 'cancelled' &&
                  'text-muted-foreground',
                loginPrelude.runStatus === 'pending' && 'text-muted-foreground',
              )}
            >
              {statusLabel}
            </p>
          ) : null}
        </div>

        {showStatus &&
        (loginPrelude.runStatus === 'failed' ||
          loginPrelude.runStatus === 'cancelled') &&
        loginPrelude.errorMessage ? (
          <div className="border-t bg-destructive/5 px-3 py-2.5">
            <p className="text-[11px] font-medium text-destructive">
              {loginPrelude.runStatus === 'cancelled' ? 'Cancelled' : 'Error'}
            </p>
            <p className="mt-0.5 text-sm text-destructive/90">
              {loginPrelude.errorMessage}
            </p>
          </div>
        ) : null}
      </div>
    </li>
  )
}

function StepIndicator({
  stepNumber,
  runStatus,
  hasRun,
  icon,
}: {
  stepNumber: number
  runStatus: TestRunStepStatus | null
  hasRun: boolean
  icon?: ReactNode
}) {
  if (!hasRun || !runStatus) {
    return (
      <span className="relative z-10 mt-3 flex size-5 shrink-0 items-center justify-center rounded-full border bg-popover text-[11px] font-medium tabular-nums text-muted-foreground">
        {icon ?? stepNumber}
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

  if (runStatus === 'cancelled') {
    return (
      <span className="relative z-10 mt-3 flex size-5 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
        <Ban className="size-3" aria-hidden />
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
  loginPrelude,
  hasRun,
}: {
  steps: TestCaseStepViewItem[]
  loginPrelude?: TestCaseLoginPrelude | null
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
          {steps.length} test {steps.length === 1 ? 'step' : 'steps'}
          {loginPrelude
            ? ` · login runs first (${loginPrelude.stepCount} ${loginPrelude.stepCount === 1 ? 'step' : 'steps'})`
            : ''}
        </p>

        <ol className="relative space-y-3">
          <div
            aria-hidden
            className="absolute top-2.5 bottom-2.5 left-2.5 w-px bg-border"
          />
          {loginPrelude ? (
            <LoginPreludeRow loginPrelude={loginPrelude} hasRun={hasRun} />
          ) : null}
          {steps.map((step) => {
            const selector = formatSelector(step.selectorType, step.selector)
            const showScreenshot = Boolean(step.screenshotUrl)
            const showError =
              hasRun &&
              (step.runStatus === 'failed' || step.runStatus === 'cancelled') &&
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
                    <StepMeta
                      label={
                        step.resolvedValue && step.resolvedValue !== step.value
                          ? 'Value → resolved'
                          : 'Value'
                      }
                      value={
                        step.resolvedValue && step.resolvedValue !== step.value
                          ? `${displayText(step.value)} → ${step.resolvedValue}`
                          : displayText(
                              step.outputVariable
                                ? `→ {{${step.outputVariable}}}`
                                : step.value,
                            )
                      }
                    />
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
                        {step.runStatus === 'cancelled' ? 'Cancelled' : 'Error'}
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
