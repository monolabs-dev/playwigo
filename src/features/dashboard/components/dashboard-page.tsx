import { CirclePlay, FolderKanban, ListChecks, Users } from 'lucide-react'

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
import { comingSoon } from '#/features/dashboard/utils/coming-soon.ts'
import {
  healthDotClass,
  healthLabel,
} from '#/features/dashboard/utils/project-display.ts'

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
                className={`size-1.5 rounded-full ${healthDotClass('idle')}`}
              />
              {healthLabel('idle')}
            </span>
            <span aria-hidden>·</span>
            <span>No runs yet</span>
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
          value={0}
          hint="Coverage groups"
          icon={FolderKanban}
          onClick={() => comingSoon('Features')}
        />
        <StatCard
          label="Test cases"
          value={0}
          hint="Ready to run"
          icon={ListChecks}
          onClick={() => comingSoon('Test cases')}
        />
        <StatCard
          label="Accounts"
          value={0}
          hint="Saved credentials"
          icon={Users}
          onClick={() => comingSoon('Test accounts')}
        />
        <StatCard
          label="Pass rate"
          value="—"
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
          <CardContent className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No runs yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              They’ll show up here after you add a test case.
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Feature coverage</CardTitle>
            <CardDescription>Passing cases in each feature.</CardDescription>
          </CardHeader>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No features yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Group test cases by the parts of the product they cover.
            </p>
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
