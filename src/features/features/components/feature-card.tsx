import {
  CirclePlay,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useCallback } from 'react'

import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import type { FeatureSummary } from '#/features/features/types/feature.ts'
import { useRunAllTestCases } from '#/features/test-cases/hooks/use-run-all-test-cases.ts'
import {
  listTestCases,
  runTestCase,
} from '#/features/test-cases/server/test-cases.ts'
import { cn } from '#/lib/utils.ts'

function passPercent(feature: FeatureSummary) {
  if (feature.testCaseCount === 0) {
    return 0
  }

  return Math.round(
    (feature.passingTestCaseCount / feature.testCaseCount) * 100,
  )
}

export function FeatureCard({
  feature,
  index,
  onEdit,
  onDelete,
  onRunComplete,
}: {
  feature: FeatureSummary
  index: number
  onEdit: (feature: FeatureSummary) => void
  onDelete: (feature: FeatureSummary) => void
  onRunComplete?: () => void
}) {
  const listCasesFn = useServerFn(listTestCases)
  const runCaseFn = useServerFn(runTestCase)

  const refreshTestCases = useCallback(async () => {
    return listCasesFn({ data: { featureId: feature.id } })
  }, [feature.id, listCasesFn])

  const { runningAll, runAll } = useRunAllTestCases({
    runCaseFn,
    refreshTestCases,
  })

  const percent = passPercent(feature)
  const hasCases = feature.testCaseCount > 0
  const canRunAll = feature.runnableTestCaseCount > 0

  async function handleRunAll() {
    const testCases = await refreshTestCases()
    const didRun = await runAll(feature.name, testCases)
    if (didRun) {
      onRunComplete?.()
    }
  }

  return (
    <Card
      className="flex h-full flex-col animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out-strong fill-mode-backwards motion-reduce:animate-none space-y-0 gap-0"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <CardHeader className="border-b">
        <CardTitle className="truncate font-semibold">{feature.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {feature.description ?? 'No description yet.'}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${feature.name}`}
                className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(feature)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(feature)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Pass rate</span>
            <span className="font-medium tabular-nums text-foreground">
              {hasCases ? `${percent}%` : '—'}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
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
          {hasCases ? (
            <p className="text-xs text-muted-foreground/50">
              {feature.passingTestCaseCount} of {feature.testCaseCount} passing
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50">
              Add test cases to track coverage.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          disabled={!canRunAll || runningAll}
          onClick={() => void handleRunAll()}
        >
          {runningAll ? <Loader2 className="animate-spin" /> : <CirclePlay />}
          Run all
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          asChild
        >
          <Link to="/features/$featureId" params={{ featureId: feature.id }}>
            <ListChecks />
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
