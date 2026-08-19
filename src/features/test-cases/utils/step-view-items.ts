import type { TestCaseStepViewItem } from '#/features/test-cases/components/test-case-steps-view.tsx'
import type { TestCaseStep } from '#/features/test-cases/types/test-case.ts'
import {
  fieldsForAction,
  formatStepActionLabel,
  normalizeStepAction,
} from '#/features/test-cases/utils/step-actions.ts'

export function toStepViewItems(steps: TestCaseStep[]): TestCaseStepViewItem[] {
  return steps.map((step, index) => {
    const fields = fieldsForAction(normalizeStepAction(step.action))

    return {
      id: step.id,
      stepNumber: index + 1,
      action: formatStepActionLabel(step.action),
      selector: fields.selector ? step.selector : null,
      selectorType: fields.selector ? step.selectorType : null,
      value: fields.value ? step.value : null,
      resolvedValue: step.resolvedValue ?? null,
      outputVariable: fields.outputVariable ? step.outputVariable : null,
      screenshotUrl: step.screenshotUrl,
      runStatus: step.runStatus,
      errorMessage: step.errorMessage,
    }
  })
}

export function stepListHasRun(steps: TestCaseStep[]) {
  return steps.some((step) => step.runStatus !== null)
}
