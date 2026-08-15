import { CirclePlay, FolderKanban, ListChecks, Users } from 'lucide-react'

import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { authClient } from '#/lib/auth-client.ts'
import { cn } from '#/lib/utils.ts'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { comingSoon } from '#/features/dashboard/utils/coming-soon.ts'
import {
  healthDotClass,
  healthLabel,
} from '#/features/dashboard/utils/project-display.ts'
import type { RunStatus } from '#/features/dashboard/types/project.ts'

export function DashboardPage() {
  const { project } = useActiveProject()
  const { data: session } = authClient.useSession()
  const firstName = session?.user.name.split(' ')[0] ?? 'there'

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
                className={cn(
                  'size-1.5 rounded-full',
                  healthDotClass(project.health),
                )}
              />
              {healthLabel(project.health)}
            </span>
            <span aria-hidden>·</span>
            <span>Last run {project.lastRunLabel}</span>
          </p>
        </div>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => comingSoon('Open website')}
        >
          Open site
        </Button>
      </section>

      {project.health === 'failing' ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Recent runs need attention in {project.name}. Check failing cases
            before the next deploy.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => comingSoon('Test runs')}
          >
            View runs
          </Button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Features"
          value={project.features}
          hint="Coverage groups"
          icon={FolderKanban}
          onClick={() => comingSoon('Features')}
        />
        <StatCard
          label="Test cases"
          value={project.testCases}
          hint="Ready to run"
          icon={ListChecks}
          onClick={() => comingSoon('Test cases')}
        />
        <StatCard
          label="Accounts"
          value={project.testAccounts}
          hint="Saved credentials"
          icon={Users}
          onClick={() => comingSoon('Test accounts')}
        />
        <StatCard
          label="Pass rate"
          value={`${project.passRate}%`}
          hint="Last 7 days"
          icon={CirclePlay}
          onClick={() => comingSoon('Test runs')}
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
          <CardContent className="px-0">
            <ul className="divide-y">
              {project.recentRuns.map((run) => (
                <li key={run.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out-strong fine-hover:bg-muted/50"
                    onClick={() => comingSoon(run.name)}
                  >
                    <StatusDot status={run.status} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {run.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {run.feature}
                      </span>
                    </span>
                    <RunBadge status={run.status} />
                    <span className="hidden w-14 text-right text-xs tabular-nums text-muted-foreground sm:block">
                      {run.duration}
                    </span>
                    <span className="hidden w-20 text-right text-xs text-muted-foreground md:block">
                      {run.at}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Feature coverage</CardTitle>
            <CardDescription>Passing cases in each feature.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {project.featureCoverage.map((feature) => {
              const percent = Math.round(
                (feature.passing / Math.max(feature.cases, 1)) * 100,
              )

              return (
                <button
                  key={feature.name}
                  type="button"
                  className="block w-full text-left"
                  onClick={() => comingSoon(feature.name)}
                >
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{feature.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {feature.passing}/{feature.cases}
                    </span>
                  </span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        percent === 100 ? 'bg-emerald-500' : 'bg-primary',
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                </button>
              )
            })}
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
}: {
  label: string
  value: string | number
  hint: string
  icon: typeof FolderKanban
  onClick: () => void
}) {
  return (
    <button type="button" className="text-left" onClick={onClick}>
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
    </button>
  )
}

function StatusDot({ status }: { status: RunStatus }) {
  const tone =
    status === 'passed'
      ? 'bg-emerald-500'
      : status === 'failed'
        ? 'bg-destructive'
        : status === 'running'
          ? 'bg-primary animate-pulse'
          : 'bg-muted-foreground/40'

  return <span className={cn('size-2 shrink-0 rounded-full', tone)} />
}

function RunBadge({ status }: { status: RunStatus }) {
  const label =
    status === 'passed'
      ? 'Passed'
      : status === 'failed'
        ? 'Failed'
        : status === 'running'
          ? 'Running'
          : 'Queued'

  return (
    <Badge
      variant={status === 'failed' ? 'destructive' : 'secondary'}
      className="capitalize"
    >
      {label}
    </Badge>
  )
}
