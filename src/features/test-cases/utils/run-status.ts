import type { TestRunStatus } from '#/features/test-cases/types/test-case.ts'

export function isActiveTestRunStatus(
  status: TestRunStatus | null | undefined,
) {
  return status === 'running' || status === 'queued'
}

export function isTerminalTestRunStatus(
  status: TestRunStatus | null | undefined,
) {
  return (
    status === 'passed' ||
    status === 'failed' ||
    status === 'error'
  )
}
