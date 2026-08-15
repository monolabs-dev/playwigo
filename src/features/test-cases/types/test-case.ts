export type TestRunStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error'

export type TestCaseSummary = {
  id: string
  featureId: string
  name: string
  baseUrl: string | null
  testAccountId: string | null
  testAccountName: string | null
  stepCount: number
  latestRunStatus: TestRunStatus | null
  latestRunDurationMs: number | null
  latestRunAt: Date | null
  createdAt: Date
  updatedAt: Date
}
