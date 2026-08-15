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
}

export const stepActionFields: Record<TestCaseStepAction, StepActionFields> = {
  goto: { selector: false, value: true },
  click: { selector: true, value: false },
  fill: { selector: true, value: true },
  select: { selector: true, value: true },
  check: { selector: true, value: false },
  uncheck: { selector: true, value: false },
  hover: { selector: true, value: false },
  wait: { selector: true, value: false },
  waitTimeout: { selector: false, value: true },
  pressKey: { selector: false, value: true },
  expectToHaveUrl: { selector: false, value: true },
  expectToHaveTitle: { selector: false, value: true },
  expectToHaveText: { selector: true, value: true },
  expectToContainText: { selector: true, value: true },
}

export function fieldsForAction(action: TestCaseStepAction): StepActionFields {
  return stepActionFields[action]
}

export function valuePlaceholderForAction(action: TestCaseStepAction) {
  switch (action) {
    case 'goto':
    case 'expectToHaveUrl':
      return 'https://app.example.com'
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
