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

const LEGACY_STEP_ACTIONS: Record<string, TestCaseStepAction> = {
  dblclick: 'click',
  type: 'fill',
  press: 'pressKey',
  selectOption: 'select',
  waitForSelector: 'wait',
  reload: 'goto',
}

export const SELECTOR_TYPE_LABELS: Record<TestCaseSelectorType, string> = {
  id: 'ID',
  class: 'Class',
  xpath: 'XPath',
  css: 'CSS',
  text: 'Text',
}

const LEGACY_SELECTOR_TYPES = ['role', 'label', 'placeholder'] as const

export function normalizeStepAction(
  value: string | null | undefined,
): TestCaseStepAction {
  if (value && (TEST_CASE_STEP_ACTIONS as readonly string[]).includes(value)) {
    return value as TestCaseStepAction
  }

  if (value && value in LEGACY_STEP_ACTIONS) {
    return LEGACY_STEP_ACTIONS[value]!
  }

  return 'click'
}

export function formatStepActionLabel(action: string) {
  const normalized = normalizeStepAction(action)
  return STEP_ACTION_LABELS[normalized]
}

export function normalizeSelectorType(
  value: string | null | undefined,
): TestCaseSelectorType {
  if (
    value &&
    (TEST_CASE_SELECTOR_TYPES as readonly string[]).includes(value)
  ) {
    return value as TestCaseSelectorType
  }

  if (value && (LEGACY_SELECTOR_TYPES as readonly string[]).includes(value)) {
    return 'css'
  }

  return 'css'
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

export function valuePlaceholderForAction(action: TestCaseStepAction) {
  switch (action) {
    case 'goto':
    case 'expectToHaveUrl':
      return 'https://app.example.com or {{loginUrl}}'
    case 'pressKey':
      return 'Enter'
    case 'waitTimeout':
      return '1000'
    case 'expectToHaveTitle':
      return 'Dashboard'
    case 'expectToHaveText':
    case 'expectToContainText':
      return 'Welcome back'
    case 'select':
      return 'Option value'
    case 'fill':
      return '{{email}} or {{$email}}'
    default:
      return 'Value'
  }
}

export function formatSelector(
  selectorType: string | null,
  selector: string | null,
) {
  if (!selector) {
    return null
  }

  const type = normalizeSelectorType(selectorType)

  if (type === 'css') {
    return selector
  }

  return `${type}:${selector}`
}

export function formatSelectorQuery(type: TestCaseSelectorType, query: string) {
  const trimmed = query.trim()
  if (!trimmed) {
    return trimmed
  }

  if (type === 'id' && !trimmed.startsWith('#')) {
    return `#${trimmed}`
  }

  if (type === 'class' && !trimmed.startsWith('.')) {
    return `.${trimmed}`
  }

  return trimmed
}

export function formatSelectorSummary(
  type: TestCaseSelectorType,
  query: string,
) {
  const trimmed = query.trim()
  if (!trimmed) {
    return null
  }

  return `${SELECTOR_TYPE_LABELS[type]}: ${formatSelectorQuery(type, trimmed)}`
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
  | Record<string, unknown>
  | null
