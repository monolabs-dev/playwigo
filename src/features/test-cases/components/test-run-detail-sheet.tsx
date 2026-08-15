import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { TestCaseStepsView } from '#/features/test-cases/components/test-case-steps-view.tsx'
import { getTestRunStatus } from '#/features/test-cases/server/test-cases.ts'
import { getOwnedTestRunStatus } from '#/features/test-cases/server/test-runs.server.ts'
import type {
  TestRunStatus,
  TestRunSummary,
} from '#/features/test-cases/types/test-case.ts'
import { RunStatusBadge } from '#/features/test-cases/components/run-status-badge.tsx'
import {
  formatRunDuration,
  formatRunTimestamp,
} from '#/features/test-cases/utils/run-display.ts'
import { isActiveTestRunStatus } from '#/features/test-cases/utils/run-status.ts'
import type { TestCaseStepViewItem } from '#/features/test-cases/components/test-case-steps-view.tsx'

const POLL_INTERVAL_MS = 1500

type TestRunDetail = Awaited<ReturnType<typeof getOwnedTestRunStatus>>

function toStepViewItems(steps: TestRunDetail['steps']): TestCaseStepViewItem[] {
  const testCaseSteps = steps.filter((step) => step.testCaseStepId !== null)

  return testCaseSteps.map((step, index) => ({
    id: step.testCaseStepId ?? `step-${step.sortOrder}`,
    stepNumber: index + 1,
    action: step.action,
    selector: step.selector,
    selectorType: step.selectorType,
    value: step.value,
    screenshotUrl: step.screenshotUrl,
    runStatus: step.status,
    errorMessage: step.errorMessage,
  }))
}

function buildLoginPrelude(
  steps: TestRunDetail['steps'],
  testCase: TestRunDetail['testCase'],
) {
  const preludeSteps = steps.filter((step) => step.testCaseStepId === null)
  if (preludeSteps.length === 0) {
    return null
  }

  const failedStep = preludeSteps.find((step) => step.status === 'failed')
  const runningStep = preludeSteps.find((step) => step.status === 'running')
  const allPassed = preludeSteps.every((step) => step.status === 'passed')

  let runStatus: TestRunDetail['steps'][number]['status'] | null = null
  if (runningStep) {
    runStatus = 'running'
  } else if (failedStep) {
    runStatus = 'failed'
  } else if (allPassed) {
    runStatus = 'passed'
  } else if (preludeSteps.some((step) => step.status === 'pending')) {
    runStatus = 'pending'
  }

  return {
    stepCount: preludeSteps.length,
    testAccountName: testCase.testAccountName,
    loginFlowName: 'Login flow',
    runStatus,
    errorMessage: failedStep?.errorMessage ?? null,
  }
}

export function TestRunDetailSheet({
  run,
  open,
  onOpenChange,
  onRunUpdated,
}: {
  run: TestRunSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRunUpdated: (patch: Pick<
    TestRunSummary,
    'id' | 'status' | 'durationMs' | 'errorMessage' | 'completedAt'
  >) => void
}) {
  const getStatusFn = useServerFn(getTestRunStatus)
  const [detail, setDetail] = useState<TestRunDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!run) {
      return null
    }

    const next = await getStatusFn({ data: { testRunId: run.id } })
    setDetail(next)
    onRunUpdated({
      id: run.id,
      status: next.status,
      durationMs: next.durationMs,
      errorMessage: next.errorMessage,
      completedAt: next.completedAt,
    })
    return next
  }, [getStatusFn, onRunUpdated, run?.id])

  useEffect(() => {
    if (!open || !run) {
      return
    }

    let cancelled = false
    setLoading(true)

    void loadDetail()
      .catch(() => {
        if (!cancelled) {
          toast.error('Unable to load test run')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadDetail, open, run])

  const active = isActiveTestRunStatus(detail?.status ?? run?.status)

  useEffect(() => {
    if (!open || !active) {
      return
    }

    const interval = window.setInterval(() => {
      void loadDetail().catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [active, loadDetail, open])

  const status = (detail?.status ?? run?.status ?? null) as TestRunStatus | null
  const stepItems = detail ? toStepViewItems(detail.steps) : []
  const loginPrelude = detail
    ? buildLoginPrelude(detail.steps, detail.testCase)
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[50vw]"
      >
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <RunStatusBadge status={active ? 'running' : status} />
            {run ? (
              <span className="text-xs text-muted-foreground">
                {formatRunTimestamp(run.startedAt ?? run.createdAt)}
                {run.durationMs !== null
                  ? ` · ${formatRunDuration(run.durationMs)}`
                  : ''}
              </span>
            ) : null}
          </div>
          <SheetTitle className="text-left">
            {run?.testCaseName ?? 'Test run'}
          </SheetTitle>
          <SheetDescription className="text-left">
            {run ? (
              <>
                <Link
                  to="/features/$featureId"
                  params={{ featureId: run.featureId }}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {run.featureName}
                </Link>
                {run.testAccountName ? ` · ${run.testAccountName}` : null}
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && !detail ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : detail?.errorMessage && !active ? (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm font-medium text-destructive">Run failed</p>
              <p className="mt-1 text-sm text-destructive/90">
                {detail.errorMessage}
              </p>
            </div>
          ) : null}

          {detail ? (
            <TestCaseStepsView
              steps={stepItems}
              loginPrelude={loginPrelude}
              hasRun
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
