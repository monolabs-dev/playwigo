import type { Locator, Page } from '@cloudflare/playwright'

import {
  delay,
  withWallClock,
} from '#/features/test-cases/server/bounded-playwright.ts'
import {
  formatSelectorQuery,
  normalizeSelectorType,
} from '#/features/test-cases/utils/step-actions.ts'
import type { TestCaseSelectorType } from '#/features/test-cases/utils/step-actions.ts'
import type { BrowserStepOptions } from '#/features/test-cases/server/browser-step-options.ts'
import { DIALOG_SCOPE_WAIT_MS } from '#/features/test-cases/server/run-limits.ts'

const LOCATOR_WAIT_MS = 10_000
const DIALOG_SCAN_MS = 3_000
const POST_CLICK_SETTLE_MS = 5_000

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

  const dialogCount = await withWallClock(
    dialogs.count(),
    DIALOG_SCAN_MS,
    'dialog scan timed out',
  ).catch(() => 0)

  if (dialogCount === 0) {
    return baseTarget
  }

  await withWallClock(
    dialogs
      .last()
      .waitFor({ state: 'visible', timeout: DIALOG_SCOPE_WAIT_MS }),
    DIALOG_SCOPE_WAIT_MS + 500,
    'dialog wait timed out',
  ).catch(() => {})

  const scoped = locatorInsideDialog(page, selectorType, selector)
  const scopedCount = await withWallClock(
    scoped.count(),
    DIALOG_SCAN_MS,
    'dialog scoped count timed out',
  ).catch(() => 0)

  if (scopedCount > 0) {
    return scoped.locator('visible=true').first()
  }

  return baseTarget
}

function locatorForSelectorType(
  page: Page,
  type: TestCaseSelectorType,
  query: string,
): Locator {
  if (type === 'xpath') {
    return page.locator(`xpath=${query}`)
  }

  if (type === 'text') {
    return page
      .getByRole('link', { name: query, exact: false })
      .or(page.getByRole('button', { name: query, exact: false }))
      .or(page.getByText(query, { exact: false }))
  }

  return page.locator(query)
}

/** Click steps prefer role-based text matching so hidden duplicate copy in the DOM is not `.first()`. */
export function resolveClickBaseLocator(
  page: Page,
  selectorType: string | null,
  selector: string,
) {
  const type = normalizeSelectorType(selectorType)
  const query = formatSelectorQuery(type, selector)
  return locatorForSelectorType(page, type, query)
}

async function boundedLocatorWait(
  target: Locator,
  state: 'attached' | 'visible',
) {
  await withWallClock(
    target.waitFor({ state, timeout: LOCATOR_WAIT_MS }),
    LOCATOR_WAIT_MS + 500,
    `Timed out after ${LOCATOR_WAIT_MS / 1000}s waiting for a ${state} click target.`,
  )
}

export async function performClick(
  page: Page,
  clickTarget: ReturnType<Page['locator']>,
  options: BrowserStepOptions,
) {
  const target = options.forceClick
    ? clickTarget.first()
    : clickTarget.locator('visible=true').first()

  const matchCount = await withWallClock(
    clickTarget.count(),
    LOCATOR_WAIT_MS + 500,
    'Timed out while resolving click selector matches.',
  ).catch(() => 0)

  if (matchCount === 0) {
    throw new Error('No element matched the click selector.')
  }

  await boundedLocatorWait(
    target,
    options.forceClick ? 'attached' : 'visible',
  )

  if (options.settleBeforeMs > 0) {
    await delay(options.settleBeforeMs)
  }

  await withWallClock(
    target.evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'nearest' })
    }),
    LOCATOR_WAIT_MS + 500,
    'scroll into view timed out',
  ).catch(() => {})

  await withWallClock(
    target.evaluate((el) => {
      if (!(el instanceof HTMLElement)) {
        throw new Error('Click target is not an HTML element')
      }
      el.click()
    }),
    LOCATOR_WAIT_MS + 500,
    'DOM click timed out',
  )

  await withWallClock(
    page.waitForLoadState('domcontentloaded', {
      timeout: POST_CLICK_SETTLE_MS,
    }),
    POST_CLICK_SETTLE_MS + 500,
    'post-click navigation timed out',
  ).catch(() => {})
}

/** GoWork-style radios hide the native input (`opacity: 0`). */
export async function checkOrClickInput(
  page: Page,
  locator: ReturnType<Page['locator']>,
  options: BrowserStepOptions,
) {
  const input = locator.first()

  await withWallClock(
    input.waitFor({ state: 'attached', timeout: LOCATOR_WAIT_MS }),
    LOCATOR_WAIT_MS + 500,
    'check target wait timed out',
  )

  const inputId = await withWallClock(
    input.getAttribute('id'),
    LOCATOR_WAIT_MS + 500,
    'check target id read timed out',
  ).catch(() => null)

  if (inputId) {
    await page.evaluate((id) => {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label instanceof HTMLElement) {
        label.click()
        return
      }
      const el = document.getElementById(id)
      if (el instanceof HTMLElement) {
        el.click()
      }
    }, inputId)

    const checked = await input.isChecked().catch(() => false)
    if (checked) {
      return
    }
  }

  await withWallClock(
    input.check({
      timeout: LOCATOR_WAIT_MS,
      force: options.forceClick || true,
    }),
    LOCATOR_WAIT_MS + 500,
    'check timed out',
  ).catch(() => {})
}
