export type TestRunStatus =
  'pending' | 'queued' | 'running' | 'passed' | 'failed' | 'error'

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

export type TestRunStepStatus = 'pending' | 'running' | 'passed' | 'failed'

export type TestCaseStep = {
  id: string
  testCaseId: string
  sortOrder: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  screenshotUrl: string | null
  runStatus: TestRunStepStatus | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}
