import { Ban, Check, Circle, X } from 'lucide-react'

import { Badge } from '#/components/ui/badge.tsx'
import type { TestRunStatus } from '#/features/test-cases/types/test-case.ts'
import {
  displayRunStatus,
  runStatusLabel,
} from '#/features/test-cases/utils/run-display.ts'
import { cn } from '#/lib/utils.ts'

export function RunStatusBadge({ status }: { status: TestRunStatus | null }) {
  const kind = displayRunStatus(status)
  const label = runStatusLabel(status)

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-normal',
        kind === 'passed' &&
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        kind === 'failed' &&
          'border-destructive/30 bg-destructive/10 text-destructive',
        kind === 'cancelled' && 'text-muted-foreground',
        kind === 'running' &&
          'border-primary/30 bg-primary/10 text-primary',
        kind === 'queued' && 'text-muted-foreground',
        kind === 'pending' && 'text-muted-foreground',
      )}
    >
      {kind === 'passed' ? (
        <Check className="size-3" />
      ) : kind === 'failed' ? (
        <X className="size-3" />
      ) : kind === 'cancelled' ? (
        <Ban className="size-3" />
      ) : (
        <Circle className="size-2.5 fill-current stroke-none" />
      )}
      {label}
    </Badge>
  )
}
