import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import type { TestRunSummary } from '#/features/test-cases/types/test-case.ts'
import { RunStatusBadge } from '#/features/test-cases/components/run-status-badge.tsx'
import {
  formatRunDuration,
  formatRunTimestamp,
} from '#/features/test-cases/utils/run-display.ts'
import { isActiveTestRunStatus } from '#/features/test-cases/utils/run-status.ts'

export function TestRunsTable({
  runs,
  onSelect,
}: {
  runs: TestRunSummary[]
  onSelect: (run: TestRunSummary) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 pl-4">Status</TableHead>
            <TableHead>Test case</TableHead>
            <TableHead className="w-40">Feature</TableHead>
            <TableHead className="w-36">Account</TableHead>
            <TableHead className="w-24">Duration</TableHead>
            <TableHead className="w-36 pr-4">Started</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const active = isActiveTestRunStatus(run.status)

            return (
              <TableRow
                key={run.id}
                className="cursor-pointer"
                onClick={() => onSelect(run)}
              >
                <TableCell className="pl-4">
                  <div className="flex items-center gap-2">
                    {active ? (
                      <Loader2
                        className="size-4 shrink-0 animate-spin text-primary"
                        aria-hidden
                      />
                    ) : null}
                    <RunStatusBadge status={active ? 'running' : run.status} />
                  </div>
                </TableCell>
                <TableCell className="max-w-0 font-medium">
                  <span className="block truncate">{run.testCaseName}</span>
                </TableCell>
                <TableCell className="max-w-0">
                  <Link
                    to="/features/$featureId"
                    params={{ featureId: run.featureId }}
                    className="block truncate text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {run.featureName}
                  </Link>
                </TableCell>
                <TableCell className="max-w-0 text-muted-foreground">
                  <span className="block truncate">
                    {run.testAccountName ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatRunDuration(run.durationMs)}
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">
                  {formatRunTimestamp(run.startedAt ?? run.createdAt)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
