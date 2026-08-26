import {
  fieldsForAction,
  TEST_CASE_STEP_ACTIONS,
  type BufferedStep,
  type StepConfig,
  type StepInput,
  type TestCaseStep,
  type TestCaseStepAction,
} from '@/api/types'
import { newClientId } from '@/lib/utils'

const VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

export function toBufferedSteps(steps: TestCaseStep[]): BufferedStep[] {
  return steps.map((step) => ({
    clientId: newClientId(),
    id: step.id,
    action: (TEST_CASE_STEP_ACTIONS as readonly string[]).includes(step.action)
      ? (step.action as TestCaseStepAction)
      : 'click',
    selectorType: (step.selectorType as BufferedStep['selectorType']) || 'css',
    selector: step.selector ?? '',
    value: step.value ?? '',
    outputVariable: step.outputVariable ?? '',
    config: (step.config as StepConfig) ?? null,
    warning: null,
  }))
}

export function toStepInputs(steps: BufferedStep[]): StepInput[] {
  return steps.map((step) => {
    const fields = fieldsForAction(step.action)
    return {
      ...(step.id ? { id: step.id } : {}),
      action: step.action,
      selectorType: fields.selector
        ? step.selector.trim()
          ? step.selectorType
          : null
        : null,
      selector: fields.selector
        ? step.selector.trim() || null
        : null,
      value: fields.value ? step.value.trim() || null : null,
      outputVariable: fields.outputVariable
        ? step.outputVariable.trim() || null
        : null,
      config: fields.config ? step.config : null,
    }
  })
}

export function createEmptyStep(
  action: TestCaseStepAction = 'click',
  defaults?: Partial<BufferedStep>,
): BufferedStep {
  return {
    clientId: newClientId(),
    action,
    selectorType: 'css',
    selector: '',
    value: '',
    outputVariable: '',
    config:
      action === 'setVariable'
        ? { name: '', value: '' }
        : action === 'extractText'
          ? { attribute: null, regex: null }
          : action === 'httpRequest'
            ? { method: 'GET', url: '' }
            : null,
    warning: null,
    ...defaults,
  }
}

export type StepValidationIssue = {
  clientId: string
  message: string
}

export function validateBufferedSteps(
  steps: BufferedStep[],
): StepValidationIssue[] {
  const issues: StepValidationIssue[] = []

  if (steps.length > 100) {
    issues.push({
      clientId: steps[0]?.clientId ?? 'steps',
      message: 'Too many steps (max 100)',
    })
  }

  for (const step of steps) {
    const fields = fieldsForAction(step.action)

    if (fields.selector && !step.selector.trim()) {
      issues.push({
        clientId: step.clientId,
        message: `${step.action}: selector is required`,
      })
    }

    if (fields.value && !step.value.trim()) {
      issues.push({
        clientId: step.clientId,
        message: `${step.action}: value is required`,
      })
    }

    if (fields.outputVariable && !step.outputVariable.trim()) {
      issues.push({
        clientId: step.clientId,
        message: `${step.action}: output variable is required`,
      })
    }

    if (step.outputVariable.trim() && !VARIABLE_NAME.test(step.outputVariable)) {
      issues.push({
        clientId: step.clientId,
        message: `${step.action}: invalid output variable name`,
      })
    }

    if (step.selector.length > 2000) {
      issues.push({
        clientId: step.clientId,
        message: `${step.action}: selector is too long`,
      })
    }

    if (step.value.length > 4000) {
      issues.push({
        clientId: step.clientId,
        message: `${step.action}: value is too long`,
      })
    }

    if (step.action === 'setVariable') {
      const config = step.config as { name?: string; value?: string } | null
      if (!config?.name?.trim()) {
        issues.push({
          clientId: step.clientId,
          message: 'setVariable: name is required',
        })
      } else if (!VARIABLE_NAME.test(config.name)) {
        issues.push({
          clientId: step.clientId,
          message: 'setVariable: invalid variable name',
        })
      }
    }

    if (step.action === 'httpRequest') {
      const config = step.config as { url?: string } | null
      if (!config?.url?.trim()) {
        issues.push({
          clientId: step.clientId,
          message: 'httpRequest: URL is required',
        })
      }
    }
  }

  return issues
}
