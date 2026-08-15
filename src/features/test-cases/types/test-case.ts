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

export type ProjectTestCaseSummary = TestCaseSummary & {
  featureName: string
}

export type TestRunStepStatus = 'pending' | 'running' | 'passed' | 'failed'

export type TestRunSummary = {
  id: string
  status: TestRunStatus
  durationMs: number | null
  errorMessage: string | null
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  testCaseId: string
  testCaseName: string
  featureId: string
  featureName: string
  testAccountName: string | null
}

export type TestCaseLoginPrelude = {
  stepCount: number
  testAccountName: string | null
  loginFlowName: string
  runStatus: TestRunStepStatus | null
  errorMessage: string | null
}

export type TestCaseStepsPayload = {
  steps: TestCaseStep[]
  loginPrelude: TestCaseLoginPrelude | null
}

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
