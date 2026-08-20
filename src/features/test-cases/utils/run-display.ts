import type { TestRunStatus } from '#/features/test-cases/types/test-case.ts'

export function displayRunStatus(status: TestRunStatus | null) {
  if (status === 'passed') {
    return 'passed' as const
  }

  if (status === 'failed' || status === 'error') {
    return 'failed' as const
  }

  if (status === 'cancelled') {
    return 'cancelled' as const
  }

  if (status === 'running') {
    return 'running' as const
  }

  if (status === 'queued') {
    return 'queued' as const
  }

  return 'pending' as const
}

export function runStatusLabel(status: TestRunStatus | null) {
  switch (displayRunStatus(status)) {
    case 'passed':
      return 'Passed'
    case 'failed':
      return status === 'error' ? 'Error' : 'Failed'
    case 'cancelled':
      return 'Cancelled'
    case 'running':
      return 'Running'
    case 'queued':
      return 'Queued'
    default:
      return 'Pending'
  }
}

export function formatRunDuration(durationMs: number | null) {
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

export function formatRunTimestamp(date: Date | string | null) {
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
