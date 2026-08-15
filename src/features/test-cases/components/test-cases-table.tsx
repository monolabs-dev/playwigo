import { useEffect, useState } from 'react'
import {
  Check,
  Circle,
  CirclePlay,
  Copy,
  ListTree,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import type {
  TestCaseSummary,
  TestRunStatus,
} from '#/features/test-cases/types/test-case.ts'
import { isActiveTestRunStatus } from '#/features/test-cases/utils/run-status.ts'
import { cn } from '#/lib/utils.ts'

const easeOutStrong = [0.23, 1, 0.32, 1] as const

function displayStatus(status: TestRunStatus | null) {
  if (status === 'passed') {
    return 'passed' as const
  }

  if (status === 'failed' || status === 'error') {
    return 'failed' as const
  }

  if (status === 'running') {
    return 'running' as const
  }

  if (status === 'queued') {
    return 'queued' as const
  }

  return 'pending' as const
}

function statusLabel(status: TestRunStatus | null) {
  switch (displayStatus(status)) {
    case 'passed':
      return 'Passed'
    case 'failed':
      return 'Failed'
    case 'running':
      return 'Running'
    case 'queued':
      return 'Queued'
    default:
      return 'Pending'
  }
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null || durationMs <= 0) {
    return '—'
  }

  const seconds = durationMs / 1000
  return `${seconds.toLocaleString(undefined, { maximumFractionDigits: 1 })} s`
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatLastRun(date: Date | string | null) {
  const parsed = toDate(date)
  if (!parsed) {
    return '—'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

function useFinePointerHover() {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setCanHover(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return canHover
}

function DefaultStatusIcon({ status }: { status: TestRunStatus | null }) {
  const kind = displayStatus(status)

  if (kind === 'passed') {
    return (
      <Check
        className="size-4 shrink-0 text-emerald-500"
        strokeWidth={2.5}
        aria-hidden
      />
    )
  }

  if (kind === 'failed') {
    return (
      <X
        className="size-4 shrink-0 text-destructive"
        strokeWidth={2.5}
        aria-hidden
      />
    )
  }

  return (
    <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
  )
}

function StatusBadge({ status }: { status: TestRunStatus | null }) {
  const kind = displayStatus(status)
  const label = statusLabel(status)

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-normal',
        kind === 'passed' &&
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        kind === 'failed' &&
          'border-destructive/30 bg-destructive/10 text-destructive',
        kind === 'pending' && 'text-muted-foreground',
      )}
    >
      {kind === 'passed' ? (
        <Check className="size-3" />
      ) : kind === 'failed' ? (
        <X className="size-3" />
      ) : (
        <Circle className="size-2.5 fill-current stroke-none" />
      )}
      {label}
    </Badge>
  )
}

function TestCaseNameCell({
  testCase,
  running,
  onRun,
}: {
  testCase: TestCaseSummary
  running: boolean
  onRun: (testCase: TestCaseSummary) => void
}) {
  const reduceMotion = useReducedMotion()
  const canHover = useFinePointerHover()
  const [hovered, setHovered] = useState(false)
  const showRun = canHover && hovered && !running

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: easeOutStrong }

  function handleRun() {
    if (running) {
      return
    }

    onRun(testCase)
  }

  return (
    <button
      type="button"
      className={cn(
        'flex min-w-0 items-center gap-2.5 text-left',
        canHover && !running && 'cursor-pointer',
        running && 'cursor-wait',
      )}
      disabled={running}
      onMouseEnter={() => canHover && !running && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleRun}
    >
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        {running ? (
          <Loader2
            className="size-4 shrink-0 animate-spin text-primary"
            aria-hidden
          />
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {showRun ? (
            <motion.span
              key="play"
              className="absolute inset-0 flex items-center justify-center"
              initial={
                reduceMotion ? false : { opacity: 0, transform: 'scale(0.92)' }
              }
              animate={{ opacity: 1, transform: 'scale(1)' }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, transform: 'scale(0.92)' }
              }
              transition={transition}
            >
              <CirclePlay className="size-4 text-emerald-500" aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="status"
              className="absolute inset-0 flex items-center justify-center"
              initial={
                reduceMotion ? false : { opacity: 0, transform: 'scale(0.92)' }
              }
              animate={{ opacity: 1, transform: 'scale(1)' }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, transform: 'scale(0.92)' }
              }
              transition={transition}
            >
              <DefaultStatusIcon status={testCase.latestRunStatus} />
            </motion.span>
          )}
        </AnimatePresence>
        )}
      </span>

      <span className="relative min-w-0 flex-1 truncate">
        {running ? (
          <span className="block truncate text-muted-foreground">
            Running {testCase.name}…
          </span>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {showRun ? (
            <motion.span
              key="run-label"
              className="block truncate"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, transform: 'translateX(-4px)' }
              }
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, transform: 'translateX(-4px)' }
              }
              transition={transition}
            >
              <span className="text-foreground">Run:</span>{' '}
              <span className="text-muted-foreground">{testCase.name}</span>
            </motion.span>
          ) : (
            <motion.span
              key="name"
              className="block truncate"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, transform: 'translateX(4px)' }
              }
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, transform: 'translateX(4px)' }
              }
              transition={transition}
            >
              {testCase.name}
            </motion.span>
          )}
        </AnimatePresence>
        )}
      </span>
    </button>
  )
}

export function TestCasesTable({
  testCases,
  onRun,
  onRename,
  onViewSteps,
  onDelete,
}: {
  testCases: TestCaseSummary[]
  onRun: (testCase: TestCaseSummary) => void
  onRename: (testCase: TestCaseSummary) => void
  onViewSteps: (testCase: TestCaseSummary) => void
  onDelete: (testCase: TestCaseSummary) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 pl-4">Test case</TableHead>
            <TableHead className="w-20">Steps</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-24">Duration</TableHead>
            <TableHead className="w-36">Last run</TableHead>
            <TableHead className="w-12 pr-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testCases.map((testCase) => {
            const running = isActiveTestRunStatus(testCase.latestRunStatus)

            return (
            <TableRow key={testCase.id}>
              <TableCell className="max-w-0 pl-4 font-medium">
                <TestCaseNameCell
                  testCase={testCase}
                  running={running}
                  onRun={onRun}
                />
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {testCase.stepCount}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={running ? 'running' : testCase.latestRunStatus}
                />
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatDuration(testCase.latestRunDurationMs)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatLastRun(testCase.latestRunAt)}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${testCase.name}`}
                      className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onRename(testCase)}>
                      <Pencil />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewSteps(testCase)}>
                      <ListTree />
                      View & edit steps
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        toast.info('Coming soon', {
                          description: 'Duplicate will be available soon.',
                        })
                      }
                    >
                      <Copy />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(testCase)}
                    >
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
