import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { CirclePlay, FolderKanban, ListChecks, Users } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { authClient } from '#/lib/auth-client.ts'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { countFeatures, listFeatures } from '#/features/features/server/features.ts'
import type { FeatureSummary } from '#/features/features/types/feature.ts'
import {
  healthDotClass,
  healthLabel,
} from '#/features/dashboard/utils/project-display.ts'
import { listTestRuns } from '#/features/test-cases/server/test-cases.ts'
import type { TestRunSummary } from '#/features/test-cases/types/test-case.ts'
import { RunStatusBadge } from '#/features/test-cases/components/run-status-badge.tsx'
import {
  formatRunDuration,
  formatRunTimestamp,
} from '#/features/test-cases/utils/run-display.ts'
import {
  isActiveTestRunStatus,
  isTerminalTestRunStatus,
} from '#/features/test-cases/utils/run-status.ts'
import { listTestAccounts } from '#/features/test-accounts/server/test-accounts.ts'
import { cn } from '#/lib/utils.ts'

function featurePassPercent(feature: FeatureSummary) {
  if (feature.testCaseCount === 0) {
    return 0
  }

  return Math.round(
    (feature.passingTestCaseCount / feature.testCaseCount) * 100,
  )
}

function computePassRate(runs: TestRunSummary[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = runs.filter((run) => {
    const at = run.completedAt ?? run.createdAt
    const parsed = at instanceof Date ? at : new Date(at)
    return (
      isTerminalTestRunStatus(run.status) &&
      !Number.isNaN(parsed.getTime()) &&
      parsed.getTime() >= weekAgo
    )
  })

  if (recent.length === 0) {
    return null
  }

  const passed = recent.filter((run) => run.status === 'passed').length
  return Math.round((passed / recent.length) * 100)
}

function projectHealthFromRuns(runs: TestRunSummary[]) {
  if (runs.some((run) => isActiveTestRunStatus(run.status))) {
    return 'running' as const
  }

  const latest = runs.at(0)
  if (!latest) {
    return 'idle' as const
  }

  if (latest.status === 'passed') {
    return 'passing' as const
  }

  if (latest.status === 'failed' || latest.status === 'error') {
    return 'failing' as const
  }

  return 'idle' as const
}

export function DashboardPage() {
  const { project } = useActiveProject()
  const { data: session } = authClient.useSession()
  const countFn = useServerFn(countFeatures)
  const listFeaturesFn = useServerFn(listFeatures)
  const listAccountsFn = useServerFn(listTestAccounts)
  const listRunsFn = useServerFn(listTestRuns)
  const [featureCount, setFeatureCount] = useState(0)
  const [features, setFeatures] = useState<FeatureSummary[]>([])
  const [accountCount, setAccountCount] = useState(0)
  const [runs, setRuns] = useState<TestRunSummary[]>([])
  const firstName = session?.user.name.split(' ')[0] ?? 'there'

  const loadDashboard = useCallback(async () => {
    try {
      const [count, nextFeatures, accounts, nextRuns] = await Promise.all([
        countFn({ data: { projectId: project.id } }),
        listFeaturesFn({ data: { projectId: project.id } }),
        listAccountsFn({ data: { projectId: project.id } }),
        listRunsFn({ data: { projectId: project.id, limit: 50 } }),
      ])
      setFeatureCount(count)
      setFeatures(nextFeatures)
      setAccountCount(accounts.length)
      setRuns(nextRuns)
    } catch {
      setFeatureCount(0)
      setFeatures([])
      setAccountCount(0)
      setRuns([])
    }
  }, [countFn, listAccountsFn, listFeaturesFn, listRunsFn, project.id])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const passRate = useMemo(() => computePassRate(runs), [runs])
  const health = useMemo(() => projectHealthFromRuns(runs), [runs])
  const recentRuns = runs.slice(0, 5)
  const testCaseCount = useMemo(
    () => features.reduce((total, feature) => total + feature.testCaseCount, 0),
    [features],
  )
  const lastRunLabel =
    runs.length === 0
      ? 'No runs yet'
      : `Last run ${formatRunTimestamp(runs[0].startedAt ?? runs[0].createdAt)}`

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {firstName}, here’s {project.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${healthDotClass(health)}`}
              />
              {healthLabel(health)}
            </span>
            <span aria-hidden>·</span>
            <span>{lastRunLabel}</span>
          </p>
        </div>
        <Button variant="outline" className="self-start" asChild>
          <a href={project.website} target="_blank" rel="noopener noreferrer">
            Open site
          </a>
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Features"
          value={featureCount}
          hint="Coverage groups"
          icon={FolderKanban}
          to="/features"
        />
        <StatCard
          label="Test cases"
          value={testCaseCount}
          hint="Ready to run"
          icon={ListChecks}
          to="/features"
        />
        <StatCard
          label="Accounts"
          value={accountCount}
          hint="Saved credentials"
          icon={Users}
          to="/authentication/accounts"
        />
        <StatCard
          label="Pass rate"
          value={passRate === null ? '—' : `${passRate}%`}
          hint="Last 7 days"
          icon={CirclePlay}
          to="/test-runs"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3 pb-0 space-y-0 gap-0">
          <CardHeader className="border-b">
            <CardTitle>Recent runs</CardTitle>
            <CardDescription>
              Latest executions for this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {recentRuns.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">No runs yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  They’ll show up here after you run a test case.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {recentRuns.map((run) => (
                  <li key={run.id}>
                    <Link
                      to="/test-runs"
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <RunStatusBadge
                        status={
                          isActiveTestRunStatus(run.status)
                            ? 'running'
                            : run.status
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {run.testCaseName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {run.featureName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <p>{formatRunDuration(run.durationMs)}</p>
                        <p>
                          {formatRunTimestamp(run.startedAt ?? run.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 pb-0 space-y-0 gap-0">
          <CardHeader className="border-b">
            <CardTitle>Feature coverage</CardTitle>
            <CardDescription>Passing cases in each feature.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {features.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">No features yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Group test cases by the parts of the product they cover.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link to="/features">Add a feature</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {features.map((feature) => {
                  const percent = featurePassPercent(feature)
                  const hasCases = feature.testCaseCount > 0

                  return (
                    <li key={feature.id}>
                      <Link
                        to="/features/$featureId"
                        params={{ featureId: feature.id }}
                        className="block px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-medium">
                            {feature.name}
                          </p>
                          <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {hasCases
                              ? `${feature.passingTestCaseCount}/${feature.testCaseCount}`
                              : 'No cases'}
                          </p>
                        </div>
                        <div
                          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={hasCases ? percent : 0}
                          aria-label={`${percent}% of test cases passing in ${feature.name}`}
                        >
                          <div
                            className={cn(
                              'h-full origin-left rounded-full transition-transform duration-300 ease-out-strong motion-reduce:transition-none',
                              percent === 100
                                ? 'bg-emerald-500'
                                : percent > 0
                                  ? 'bg-primary'
                                  : 'bg-muted-foreground/30',
                            )}
                            style={{
                              transform: `scaleX(${hasCases ? percent / 100 : 0})`,
                            }}
                          />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  onClick,
  to,
}: {
  label: string
  value: string | number
  hint: string
  icon: typeof FolderKanban
  onClick?: () => void
  to?: LinkProps['to']
}) {
  const content = (
    <Card
      size="sm"
      className="h-full transition-colors duration-150 ease-out-strong fine-hover:bg-muted/40"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
    </Card>
  )

  if (to) {
    return (
      <Link to={to} className="text-left">
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className="text-left" onClick={onClick}>
      {content}
    </button>
  )
}
