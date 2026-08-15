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
  latestRunStatus: TestRunStatus | null
  createdAt: Date
  updatedAt: Date
}
