/**
 * Types mirrored from the Playwigo app.
 * Source of truth: src/features/test-cases/utils/step-actions.ts
 * and related feature types. Keep in sync manually.
 */

export const TEST_CASE_STEP_ACTIONS = [
  'goto',
  'click',
  'fill',
  'select',
  'check',
  'uncheck',
  'hover',
  'wait',
  'waitTimeout',
  'pressKey',
  'expectToHaveUrl',
  'expectToHaveTitle',
  'expectToHaveText',
  'expectToContainText',
  'setVariable',
  'extractText',
  'httpRequest',
] as const

export const TEST_CASE_SELECTOR_TYPES = [
  'id',
  'class',
  'xpath',
  'css',
  'text',
] as const

export type TestCaseStepAction = (typeof TEST_CASE_STEP_ACTIONS)[number]
export type TestCaseSelectorType = (typeof TEST_CASE_SELECTOR_TYPES)[number]

export const STEP_ACTION_LABELS: Record<TestCaseStepAction, string> = {
  goto: 'Goto URL',
  click: 'Click',
  fill: 'Fill',
  select: 'Select',
  check: 'Check',
  uncheck: 'Uncheck',
  hover: 'Hover',
  wait: 'Wait',
  waitTimeout: 'Wait Timeout',
  pressKey: 'Press Key',
  expectToHaveUrl: 'Expect (toHaveURL)',
  expectToHaveTitle: 'Expect (toHaveTitle)',
  expectToHaveText: 'Expect (toHaveText)',
  expectToContainText: 'Expect (toContainText)',
  setVariable: 'Set Variable',
  extractText: 'Extract Text',
  httpRequest: 'HTTP Request',
}

export type StepActionFields = {
  selector: boolean
  value: boolean
  outputVariable: boolean
  config: boolean
}

export const stepActionFields: Record<TestCaseStepAction, StepActionFields> = {
  goto: { selector: false, value: true, outputVariable: false, config: false },
  click: { selector: true, value: false, outputVariable: false, config: false },
  fill: { selector: true, value: true, outputVariable: false, config: false },
  select: { selector: true, value: true, outputVariable: false, config: false },
  check: { selector: true, value: false, outputVariable: false, config: false },
  uncheck: {
    selector: true,
    value: false,
    outputVariable: false,
    config: false,
  },
  hover: { selector: true, value: false, outputVariable: false, config: false },
  wait: { selector: true, value: false, outputVariable: false, config: false },
  waitTimeout: {
    selector: false,
    value: true,
    outputVariable: false,
    config: false,
  },
  pressKey: {
    selector: false,
    value: true,
    outputVariable: false,
    config: false,
  },
  expectToHaveUrl: {
    selector: false,
    value: true,
    outputVariable: false,
    config: false,
  },
  expectToHaveTitle: {
    selector: false,
    value: true,
    outputVariable: false,
    config: false,
  },
  expectToHaveText: {
    selector: true,
    value: true,
    outputVariable: false,
    config: false,
  },
  expectToContainText: {
    selector: true,
    value: true,
    outputVariable: false,
    config: false,
  },
  setVariable: {
    selector: false,
    value: false,
    outputVariable: false,
    config: true,
  },
  extractText: {
    selector: true,
    value: false,
    outputVariable: true,
    config: true,
  },
  httpRequest: {
    selector: false,
    value: false,
    outputVariable: true,
    config: true,
  },
}

export function fieldsForAction(action: TestCaseStepAction): StepActionFields {
  return stepActionFields[action]
}

export type SetVariableConfig = {
  name: string
  value: string
}

export type ExtractTextConfig = {
  attribute?: string | null
  regex?: string | null
}

export type HttpRequestConfig = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers?: Record<string, string> | null
  body?: string | null
  jsonPath?: string | null
  regex?: string | null
  expectStatus?: number | null
  retry?: {
    attempts: number
    intervalMs: number
  } | null
}

export type StepConfig =
  | SetVariableConfig
  | ExtractTextConfig
  | HttpRequestConfig
  | null

export type Project = {
  id: string
  name: string
  website: string | null
}

export type FeatureSummary = {
  id: string
  projectId: string
  name: string
  description: string | null
  testCaseCount: number
  passingTestCaseCount: number
  runnableTestCaseCount: number
  createdAt: string
  updatedAt: string
}

export type TestRunStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error'
  | 'cancelled'

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
  latestRunAt: string | null
  createdAt: string
  updatedAt: string
}

export type TestCaseStep = {
  id: string
  testCaseId: string
  sortOrder: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  outputVariable: string | null
  config: StepConfig
  createdAt?: string
  updatedAt?: string
  screenshotUrl?: string | null
  runStatus?: string | null
  errorMessage?: string | null
}

export type TestCaseLoginPrelude = {
  testAccountId: string
  testAccountName: string
  loginFlowId: string
  loginFlowName: string
  stepCount: number
} | null

export type TestCaseStepsPayload = {
  steps: TestCaseStep[]
  loginPrelude: TestCaseLoginPrelude
}

export type StepInput = {
  id?: string
  action: TestCaseStepAction
  selectorType?: TestCaseSelectorType | null
  selector?: string | null
  value?: string | null
  outputVariable?: string | null
  config?: StepConfig
}

/** Local buffer step used while recording/editing in the extension. */
export type BufferedStep = {
  /** Stable client id for React keys / dnd — not sent to the API. */
  clientId: string
  id?: string
  action: TestCaseStepAction
  selectorType: TestCaseSelectorType
  selector: string
  value: string
  outputVariable: string
  config: StepConfig
  /** Soft warning (e.g. password field left blank). */
  warning?: string | null
}

export const DEFAULT_API_URL = 'https://playwigo.monolabs.workers.dev'
