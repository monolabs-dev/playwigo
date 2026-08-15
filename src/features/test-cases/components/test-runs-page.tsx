import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CirclePlay, FolderKanban } from 'lucide-react'
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
import { TestRunDetailSheet } from '#/features/test-cases/components/test-run-detail-sheet.tsx'
import { TestRunsTable } from '#/features/test-cases/components/test-runs-table.tsx'
import { listTestRuns } from '#/features/test-cases/server/test-cases.ts'
import type { TestRunSummary } from '#/features/test-cases/types/test-case.ts'
import { isActiveTestRunStatus } from '#/features/test-cases/utils/run-status.ts'

const POLL_INTERVAL_MS = 1500

export function TestRunsPage() {
  const { project } = useActiveProject()
  const listFn = useServerFn(listTestRuns)
  const [runs, setRuns] = useState<TestRunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState<TestRunSummary | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadRuns = useCallback(async () => {
    try {
      const next = await listFn({ data: { projectId: project.id } })
      setRuns(next)
      setSelectedRun((current) => {
        if (!current) {
          return current
        }

        return next.find((item) => item.id === current.id) ?? current
      })
      return next
    } catch {
      toast.error('Unable to load test runs')
      return []
    }
  }, [listFn, project.id])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    void loadRuns().finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [loadRuns])

  const hasActiveRuns = runs.some((run) => isActiveTestRunStatus(run.status))

  useEffect(() => {
    if (!hasActiveRuns) {
      return
    }

    const interval = window.setInterval(() => {
      void loadRuns()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [hasActiveRuns, loadRuns])

  function openRunDetail(run: TestRunSummary) {
    setSelectedRun(run)
    setDetailOpen(true)
  }

  function handleRunUpdated(
    patch: Pick<
      TestRunSummary,
      'id' | 'status' | 'durationMs' | 'errorMessage' | 'completedAt'
    >,
  ) {
    setRuns((current) =>
      current.map((item) =>
        item.id === patch.id ? { ...item, ...patch } : item,
      ),
    )
    setSelectedRun((current) =>
      current?.id === patch.id ? { ...current, ...patch } : current,
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Test runs
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every execution for{' '}
          <span className="text-foreground">{project.name}</span>, with status,
          duration, and step results.
        </p>
      </section>

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : runs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <CirclePlay className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="font-display text-xl">
                No test runs yet
              </CardTitle>
              <CardDescription className="mx-auto max-w-md">
                Runs appear here after you execute a test case from a feature.
                Add test cases under Features, then run them to see results.
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link to="/features">
                <FolderKanban />
                Go to features
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TestRunsTable runs={runs} onSelect={openRunDetail} />
      )}

      <TestRunDetailSheet
        run={selectedRun}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRunUpdated={handleRunUpdated}
      />
    </div>
  )
}
