import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, CirclePlay, ListChecks, Loader2, Plus } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { getFeature } from '#/features/features/server/features.ts'
import type { FeatureSummary } from '#/features/features/types/feature.ts'
import { DeleteTestCaseDialog } from '#/features/test-cases/components/delete-test-case-dialog.tsx'
import { TestCaseDialog } from '#/features/test-cases/components/test-case-dialog.tsx'
import { TestCaseStepsSheet } from '#/features/test-cases/components/test-case-steps-sheet.tsx'
import { TestCasesTable } from '#/features/test-cases/components/test-cases-table.tsx'
import { listTestCases, runTestCase } from '#/features/test-cases/server/test-cases.ts'
import type {
  TestCaseSummary,
  TestRunStatus,
} from '#/features/test-cases/types/test-case.ts'
import {
  isActiveTestRunStatus,
  isTerminalTestRunStatus,
} from '#/features/test-cases/utils/run-status.ts'
import { listTestAccounts } from '#/features/test-accounts/server/test-accounts.ts'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

const POLL_INTERVAL_MS = 1500

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function FeatureDetailPage() {
  const { featureId } = useParams({ from: '/_app/_shell/features/$featureId' })
  const { project } = useActiveProject()
  const getFeatureFn = useServerFn(getFeature)
  const listCasesFn = useServerFn(listTestCases)
  const runCaseFn = useServerFn(runTestCase)
  const listAccountsFn = useServerFn(listTestAccounts)
  const [feature, setFeature] = useState<FeatureSummary | null>(null)
  const [testCases, setTestCases] = useState<TestCaseSummary[]>([])
  const [testAccounts, setTestAccounts] = useState<TestAccountSummary[]>([])
  const [runningAll, setRunningAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedTestCase, setSelectedTestCase] =
    useState<TestCaseSummary | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [testCaseToDelete, setTestCaseToDelete] =
    useState<TestCaseSummary | null>(null)
  const [stepsOpen, setStepsOpen] = useState(false)
  const [stepsTestCase, setStepsTestCase] = useState<TestCaseSummary | null>(
    null,
  )
  const prevStatusesRef = useRef<Map<string, TestRunStatus | null>>(new Map())
  const statusesInitializedRef = useRef(false)

  const hasActiveRuns = testCases.some((testCase) =>
    isActiveTestRunStatus(testCase.latestRunStatus),
  )

  const refreshTestCases = useCallback(async () => {
    const nextCases = await listCasesFn({ data: { featureId } })
    setTestCases(nextCases)
    setStepsTestCase((current) => {
      if (!current) {
        return current
      }

      return nextCases.find((item) => item.id === current.id) ?? current
    })
    return nextCases
  }, [featureId, listCasesFn])

  const refreshFeature = useCallback(async () => {
    const next = await getFeatureFn({ data: { featureId } })
    setFeature(next)
    return next
  }, [featureId, getFeatureFn])

  const loadPage = useCallback(async () => {
    setLoading(true)

    try {
      const [nextFeature, nextCases, nextAccounts] = await Promise.all([
        getFeatureFn({ data: { featureId } }),
        listCasesFn({ data: { featureId } }),
        listAccountsFn({ data: { projectId: project.id } }),
      ])
      setFeature(nextFeature)
      setTestCases(nextCases)
      setTestAccounts(nextAccounts)
    } catch {
      toast.error('Unable to load feature')
    } finally {
      setLoading(false)
    }
  }, [featureId, getFeatureFn, listAccountsFn, listCasesFn, project.id])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  useEffect(() => {
    if (!hasActiveRuns) {
      return
    }

    const interval = window.setInterval(() => {
      void refreshTestCases().catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [hasActiveRuns, refreshTestCases])

  useEffect(() => {
    if (!statusesInitializedRef.current) {
      for (const testCase of testCases) {
        prevStatusesRef.current.set(testCase.id, testCase.latestRunStatus)
      }

      if (testCases.length > 0 || !loading) {
        statusesInitializedRef.current = true
      }

      return
    }

    for (const testCase of testCases) {
      const previousStatus = prevStatusesRef.current.get(testCase.id)
      const currentStatus = testCase.latestRunStatus

      if (
        isActiveTestRunStatus(previousStatus) &&
        currentStatus === 'passed'
      ) {
        toast.success('Test passed', {
          description: `${testCase.name} finished in ${((testCase.latestRunDurationMs ?? 0) / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} s`,
        })
      } else if (
        isActiveTestRunStatus(previousStatus) &&
        (currentStatus === 'failed' || currentStatus === 'error')
      ) {
        toast.error(currentStatus === 'failed' ? 'Test failed' : 'Run error', {
          description: `${testCase.name} did not finish successfully.`,
        })
      }

      prevStatusesRef.current.set(testCase.id, currentStatus)
    }
  }, [loading, testCases])

  function openCreateDialog() {
    setDialogMode('create')
    setSelectedTestCase(null)
    setDialogOpen(true)
  }

  function openEditDialog(testCase: TestCaseSummary) {
    setDialogMode('edit')
    setSelectedTestCase(testCase)
    setDialogOpen(true)
  }

  function openDeleteDialog(testCase: TestCaseSummary) {
    setTestCaseToDelete(testCase)
    setDeleteOpen(true)
  }

  function openStepsSheet(testCase: TestCaseSummary) {
    setStepsTestCase(testCase)
    setStepsOpen(true)
  }

  async function waitForTestCaseCompletion(testCaseId: string) {
    while (true) {
      const nextCases = await refreshTestCases()
      const testCase = nextCases.find((item) => item.id === testCaseId)

      if (!testCase || !isActiveTestRunStatus(testCase.latestRunStatus)) {
        return testCase ?? null
      }

      await delay(POLL_INTERVAL_MS)
    }
  }

  async function executeTestCaseRun(testCase: TestCaseSummary) {
    if (testCase.stepCount === 0) {
      toast.error('No steps to run', {
        description: `Add steps to “${testCase.name}” before running it.`,
      })
      return null
    }

    if (isActiveTestRunStatus(testCase.latestRunStatus)) {
      toast.info('Already running', {
        description: `${testCase.name} is still executing.`,
      })
      return null
    }

    try {
      const result = await runCaseFn({ data: { testCaseId: testCase.id } })

      setTestCases((current) =>
        current.map((item) =>
          item.id === result.testCase.id ? result.testCase : item,
        ),
      )
      setStepsTestCase((current) =>
        current?.id === result.testCase.id ? result.testCase : current,
      )
      prevStatusesRef.current.set(testCase.id, 'running')

      return result
    } catch (error) {
      toast.error('Unable to run test case', {
        description:
          error instanceof Error ? error.message : 'Try again in a moment.',
      })
      return null
    }
  }

  async function handleRunTestCase(testCase: TestCaseSummary) {
    await executeTestCaseRun(testCase)
  }

  async function handleRunAll() {
    if (!feature || testCases.length === 0) {
      return
    }

    const runnableCases = testCases.filter((testCase) => testCase.stepCount > 0)

    if (runnableCases.length === 0) {
      toast.error('No runnable test cases', {
        description: 'Add steps to at least one test case before running.',
      })
      return
    }

    setRunningAll(true)

    try {
      let passed = 0
      let failed = 0

      for (const testCase of runnableCases) {
        const started = await executeTestCaseRun(testCase)
        if (!started) {
          continue
        }

        const completed = await waitForTestCaseCompletion(testCase.id)
        if (completed?.latestRunStatus === 'passed') {
          passed += 1
        } else if (completed && isTerminalTestRunStatus(completed.latestRunStatus)) {
          failed += 1
        }
      }

      if (failed === 0) {
        toast.success('All tests passed', {
          description: `${passed} test case${passed === 1 ? '' : 's'} passed in ${feature.name}.`,
        })
      } else {
        toast.error('Some tests failed', {
          description: `${passed} passed, ${failed} failed in ${feature.name}.`,
        })
      }
    } finally {
      setRunningAll(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!feature) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          asChild
        >
          <Link to="/features">
            <ArrowLeft />
            Back to features
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Feature not found.</p>
      </div>
    )
  }

  const hasCases = feature.testCaseCount > 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          asChild
        >
          <Link to="/features">
            <ArrowLeft />
            Features
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {feature.name}
            </h1>
            {feature.description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {feature.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Button
              variant="outline"
              className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              disabled={!hasCases || runningAll || hasActiveRuns}
              onClick={() => void handleRunAll()}
            >
              {runningAll ? <Loader2 className="animate-spin" /> : <CirclePlay />}
              Run all
            </Button>
            <Button
              className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              onClick={openCreateDialog}
            >
              <Plus />
              Add test case
            </Button>
          </div>
        </div>
      </section>

      {testCases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <ListChecks className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="font-display text-xl">
                No test cases yet
              </CardTitle>
              <CardDescription className="mx-auto max-w-md">
                Add the first test case for {feature.name}. Steps and runs will
                live here.
              </CardDescription>
            </div>
            <Button
              className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              onClick={openCreateDialog}
            >
              <Plus />
              Add your first test case
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TestCasesTable
          testCases={testCases}
          onRun={(testCase) => void handleRunTestCase(testCase)}
          onRename={openEditDialog}
          onViewSteps={openStepsSheet}
          onDelete={openDeleteDialog}
        />
      )}

      <TestCaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        featureId={feature.id}
        defaultBaseUrl={project.website}
        testAccounts={testAccounts}
        testCase={selectedTestCase ?? undefined}
        onSubmitted={async (saved) => {
          setTestCases((current) => {
            const existing = current.find((item) => item.id === saved.id)
            if (existing) {
              return current.map((item) =>
                item.id === saved.id ? saved : item,
              )
            }
            return [saved, ...current]
          })
          await refreshFeature()
          toast.success(
            dialogMode === 'create' ? 'Test case added' : 'Test case updated',
            { description: saved.name },
          )
        }}
      />

      <TestCaseStepsSheet
        testCase={stepsTestCase}
        open={stepsOpen}
        onOpenChange={setStepsOpen}
        onSaved={(saved) => {
          setTestCases((current) =>
            current.map((item) => (item.id === saved.id ? saved : item)),
          )
          setStepsTestCase(saved)
        }}
      />

      <DeleteTestCaseDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        testCase={testCaseToDelete}
        onDeleted={async (deleted) => {
          setTestCases((current) =>
            current.filter((item) => item.id !== deleted.id),
          )
          await refreshFeature()
          toast.success('Test case deleted', {
            description: deleted.name,
          })
        }}
      />
    </div>
  )
}
