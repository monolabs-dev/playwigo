import { CirclePlay } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import type {
  TestCaseSummary,
  TestRunStatus,
} from '#/features/test-cases/types/test-case.ts'
import { cn } from '#/lib/utils.ts'

function runStatusLabel(status: TestRunStatus | null) {
  if (!status) {
    return 'Not run'
  }

  switch (status) {
    case 'passed':
      return 'Passed'
    case 'failed':
    case 'error':
      return 'Failed'
    case 'running':
      return 'Running'
    case 'queued':
      return 'Queued'
    case 'pending':
      return 'Pending'
  }
}

function runStatusVariant(status: TestRunStatus | null) {
  if (!status) {
    return 'outline' as const
  }

  switch (status) {
    case 'passed':
      return 'secondary' as const
    case 'failed':
    case 'error':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

export function TestCaseRow({
  testCase,
  index,
}: {
  testCase: TestCaseSummary
  index: number
}) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out-strong fill-mode-backwards motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base font-semibold">
            {testCase.name}
          </CardTitle>
          {testCase.baseUrl ? (
            <CardDescription className="truncate">{testCase.baseUrl}</CardDescription>
          ) : (
            <CardDescription>No base URL set</CardDescription>
          )}
        </div>
        <Badge
          variant={runStatusVariant(testCase.latestRunStatus)}
          className={cn(
            'shrink-0',
            testCase.latestRunStatus === 'passed' &&
              'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
          )}
        >
          {runStatusLabel(testCase.latestRunStatus)}
        </Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          onClick={() =>
            toast.info('Run queued', {
              description: `“${testCase.name}” will run here soon.`,
            })
          }
        >
          <CirclePlay />
          Run
        </Button>
      </CardContent>
    </Card>
  )
}
