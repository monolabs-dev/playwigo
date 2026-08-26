import type { BufferedStep, TestCaseStepAction } from '@/api/types'
import { resolveSelector } from './selector'

export type RecordedPayload = Omit<BufferedStep, 'clientId'> & {
  clientId?: string
}

function isEditable(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  )
}

function isPasswordInput(el: Element) {
  return el instanceof HTMLInputElement && el.type === 'password'
}

function isCheckboxLike(el: Element) {
  return (
    el instanceof HTMLInputElement &&
    (el.type === 'checkbox' || el.type === 'radio')
  )
}

export function stepFromClick(
  target: Element,
  options?: { hover?: boolean },
): RecordedPayload | null {
  if (options?.hover) {
    const interactive =
      target.closest(
        'a, button, [role="button"], input, select, textarea, summary, [onclick], [role="menuitem"], [role="option"]',
      ) ?? target
    const resolved = resolveSelector(interactive)
    return {
      action: 'hover',
      selectorType: resolved.selectorType,
      selector: resolved.selector,
      value: '',
      outputVariable: '',
      config: null,
      warning: null,
    }
  }

  if (isCheckboxLike(target)) {
    const checked = (target as HTMLInputElement).checked
    const resolved = resolveSelector(target)
    return {
      action: checked ? 'check' : 'uncheck',
      selectorType: resolved.selectorType,
      selector: resolved.selector,
      value: '',
      outputVariable: '',
      config: null,
      warning: null,
    }
  }

  // Prefer the interactive ancestor for nested icons/spans.
  const interactive =
    target.closest(
      'a, button, [role="button"], input, select, textarea, summary, [onclick]',
    ) ?? target

  if (
    interactive instanceof HTMLInputElement ||
    interactive instanceof HTMLTextAreaElement ||
    interactive instanceof HTMLSelectElement
  ) {
    // Let input/change handlers own form controls.
    return null
  }

  const resolved = resolveSelector(interactive)
  return {
    action: 'click',
    selectorType: resolved.selectorType,
    selector: resolved.selector,
    value: '',
    outputVariable: '',
    config: null,
    warning: null,
  }
}

export function stepFromInput(target: Element): RecordedPayload | null {
  if (!isEditable(target)) return null
  if (target instanceof HTMLSelectElement) return null

  if (isCheckboxLike(target)) {
    const checked = (target as HTMLInputElement).checked
    const resolved = resolveSelector(target)
    return {
      action: checked ? 'check' : 'uncheck',
      selectorType: resolved.selectorType,
      selector: resolved.selector,
      value: '',
      outputVariable: '',
      config: null,
      warning: null,
    }
  }

  const resolved = resolveSelector(target)
  const password = isPasswordInput(target)
  return {
    action: 'fill',
    selectorType: resolved.selectorType,
    selector: resolved.selector,
    value: password ? '' : target.value,
    outputVariable: '',
    config: null,
    warning: password
      ? 'Password values are not recorded — use a test account instead'
      : null,
  }
}

export function stepFromSelect(target: Element): RecordedPayload | null {
  if (!(target instanceof HTMLSelectElement)) return null
  const resolved = resolveSelector(target)
  return {
    action: 'select',
    selectorType: resolved.selectorType,
    selector: resolved.selector,
    value: target.value,
    outputVariable: '',
    config: null,
    warning: null,
  }
}

export function stepFromKeydown(event: KeyboardEvent): RecordedPayload | null {
  const key = event.key
  if (!['Enter', 'Tab', 'Escape'].includes(key)) return null
  // Skip Enter inside textareas (new line).
  if (
    key === 'Enter' &&
    event.target instanceof HTMLTextAreaElement &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    return null
  }
  return {
    action: 'pressKey',
    selectorType: 'css',
    selector: '',
    value: key,
    outputVariable: '',
    config: null,
    warning: null,
  }
}

export function stepFromGoto(url: string): RecordedPayload {
  return {
    action: 'goto',
    selectorType: 'css',
    selector: '',
    value: url,
    outputVariable: '',
    config: null,
    warning: null,
  }
}

export function isSameFillTarget(
  previous: { action: TestCaseStepAction; selector: string },
  next: RecordedPayload,
) {
  return (
    previous.action === 'fill' &&
    next.action === 'fill' &&
    previous.selector === next.selector
  )
}
