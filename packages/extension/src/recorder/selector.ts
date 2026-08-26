import type { TestCaseSelectorType } from '@/api/types'

const GENERATED_CLASS = /\d{3,}|^css-|^sc-|^emotion-|^svelte-|^jsx-/

export type ResolvedSelector = {
  selectorType: TestCaseSelectorType
  selector: string
}

function isUniqueCss(query: string, root: Document | ShadowRoot = document) {
  try {
    return root.querySelectorAll(query).length === 1
  } catch {
    return false
  }
}

function cssEscape(value: string) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1')
}

function attrSelector(name: string, value: string) {
  return `[${name}="${cssEscape(value)}"]`
}

function stableClasses(el: Element) {
  return [...el.classList].filter(
    (cls) => cls && !GENERATED_CLASS.test(cls) && cls.length < 40,
  )
}

function tagName(el: Element) {
  return el.tagName.toLowerCase()
}

function buildCssPath(el: Element, maxDepth = 4): string | null {
  const parts: string[] = []
  let current: Element | null = el
  let depth = 0

  while (current && current !== document.documentElement && depth < maxDepth) {
    let part = tagName(current)
    const classes = stableClasses(current)
    if (classes[0]) {
      part += `.${cssEscape(classes[0])}`
    }

    const parent = current.parentElement
    if (parent) {
      const siblings = [...parent.children].filter(
        (child) => tagName(child) === tagName(current!),
      )
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        part += `:nth-of-type(${index})`
      }
    }

    parts.unshift(part)
    const candidate = parts.join(' > ')
    if (isUniqueCss(candidate)) {
      return candidate
    }

    current = parent
    depth += 1
  }

  const full = parts.join(' > ')
  return isUniqueCss(full) ? full : null
}

function absoluteXPath(el: Element): string {
  if (el.id) {
    return `//*[@id="${el.id}"]`
  }

  const parts: string[] = []
  let current: Element | null = el

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousElementSibling
    while (sibling) {
      if (sibling.tagName === current.tagName) index += 1
      sibling = sibling.previousElementSibling
    }
    parts.unshift(`${tagName(current)}[${index}]`)
    current = current.parentElement
  }

  return `/${parts.join('/')}`
}

export function resolveSelector(el: Element): ResolvedSelector {
  const testId =
    el.getAttribute('data-testid') ||
    el.getAttribute('data-test') ||
    el.getAttribute('data-cy')
  if (testId) {
    const selector = attrSelector(
      el.getAttribute('data-testid')
        ? 'data-testid'
        : el.getAttribute('data-test')
          ? 'data-test'
          : 'data-cy',
      testId,
    )
    if (isUniqueCss(selector)) {
      return { selectorType: 'css', selector }
    }
  }

  if (el.id && !GENERATED_CLASS.test(el.id)) {
    const id = el.id
    if (isUniqueCss(`#${cssEscape(id)}`)) {
      return { selectorType: 'id', selector: id }
    }
  }

  const name = el.getAttribute('name')
  if (name && ['input', 'select', 'textarea', 'button'].includes(tagName(el))) {
    const selector = `${tagName(el)}${attrSelector('name', name)}`
    if (isUniqueCss(selector)) {
      return { selectorType: 'css', selector }
    }
  }

  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel) {
    const role = el.getAttribute('role')
    const selector = role
      ? `${attrSelector('role', role)}${attrSelector('aria-label', ariaLabel)}`
      : `${tagName(el)}${attrSelector('aria-label', ariaLabel)}`
    if (isUniqueCss(selector)) {
      return { selectorType: 'css', selector }
    }
  }

  const path = buildCssPath(el)
  if (path) {
    return { selectorType: 'css', selector: path }
  }

  return { selectorType: 'xpath', selector: absoluteXPath(el) }
}
