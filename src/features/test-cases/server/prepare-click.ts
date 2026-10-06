import type { Page } from '@cloudflare/playwright'

import {
  formatSelectorQuery,
  normalizeSelectorType,
} from '#/features/test-cases/utils/step-actions.ts'
import type { BrowserStepOptions } from '#/features/test-cases/server/browser-step-options.ts'
import {
  DIALOG_SCOPE_WAIT_MS,
  STEP_TIMEOUT_MS,
} from '#/features/test-cases/server/run-limits.ts'

function visibleDialogs(page: Page) {
  return page
    .locator('[role="dialog"], [aria-modal="true"]')
    .filter({ visible: true })
}

function locatorInsideDialog(
  page: Page,
  selectorType: string | null,
  selector: string,
) {
  const type = normalizeSelectorType(selectorType)
  const query = formatSelectorQuery(type, selector)
  const dialog = visibleDialogs(page).last()

  if (type === 'xpath') {
    return dialog.locator(`xpath=${query}`)
  }

  if (type === 'text') {
    return dialog.getByText(query, { exact: false })
  }

  return dialog.locator(query)
}

export async function resolveClickTarget(
  page: Page,
  baseTarget: ReturnType<Page['locator']>,
  selectorType: string | null,
  selector: string,
  options: BrowserStepOptions,
) {
  if (options.scopeToDialog === false || selector.length === 0) {
    return baseTarget
  }

  const dialogs = visibleDialogs(page)
  if ((await dialogs.count()) === 0) {
    return baseTarget
  }

  await dialogs
    .last()
    .waitFor({ state: 'visible', timeout: DIALOG_SCOPE_WAIT_MS })
    .catch(() => {})

  const scoped = locatorInsideDialog(page, selectorType, selector)
  if ((await scoped.count()) > 0) {
    return scoped.filter({ visible: true }).first()
  }

  return baseTarget
}

export async function performClick(
  page: Page,
  clickTarget: ReturnType<Page['locator']>,
  options: BrowserStepOptions,
) {
  // Styled radios/checkboxes are often opacity:0; forceClick must not wait for visible.
  const target = options.forceClick
    ? clickTarget.first()
    : clickTarget.filter({ visible: true }).first()

  await target.waitFor({
    state: options.forceClick ? 'attached' : 'visible',
    timeout: STEP_TIMEOUT_MS,
  })

  if (options.settleBeforeMs > 0) {
    await page.waitForTimeout(options.settleBeforeMs)
  }

  await target.scrollIntoViewIfNeeded({
    timeout: STEP_TIMEOUT_MS,
  })

  await target.click({
    timeout: STEP_TIMEOUT_MS,
    force: options.forceClick,
  })
}
