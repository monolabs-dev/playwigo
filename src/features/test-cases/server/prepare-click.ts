import type { Locator, Page } from '@cloudflare/playwright'

import {
  formatSelectorQuery,
  normalizeSelectorType,
} from '#/features/test-cases/utils/step-actions.ts'
import type { TestCaseSelectorType } from '#/features/test-cases/utils/step-actions.ts'
import type { BrowserStepOptions } from '#/features/test-cases/server/browser-step-options.ts'
import {
  DIALOG_SCOPE_WAIT_MS,
  STEP_TIMEOUT_MS,
} from '#/features/test-cases/server/run-limits.ts'

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

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

/** Playwright `locator.waitFor` / `click` can hang without rejecting on Browser Run. */
const LOCATOR_WAIT_MS = 10_000

async function boundedLocatorWait(
  target: Locator,
  state: 'attached' | 'visible',
) {
  await Promise.race([
    target.waitFor({ state, timeout: LOCATOR_WAIT_MS }),
    delay(LOCATOR_WAIT_MS + 500).then(() => {
      throw new Error(
        `Timed out after ${LOCATOR_WAIT_MS / 1000}s waiting for a ${state} click target.`,
      )
    }),
  ])
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

export async function performClick(
  page: Page,
  clickTarget: ReturnType<Page['locator']>,
  options: BrowserStepOptions,
) {
  // Styled radios/checkboxes are often opacity:0; forceClick must not wait for visible.
  const target = options.forceClick
    ? clickTarget.first()
    : clickTarget.locator('visible=true').first()

  const matchCount = await clickTarget.count()
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

  await target
    .evaluate((el) => {
      el.scrollIntoView({ block: 'center', inline: 'nearest' })
    })
    .catch(() => {})

  // Never call locator.click() here — Browser Run can hang without rejecting.
  await target.evaluate((el) => {
    if (!(el instanceof HTMLElement)) {
      throw new Error('Click target is not an HTML element')
    }
    el.click()
  })

  await page
    .waitForLoadState('domcontentloaded', { timeout: STEP_TIMEOUT_MS })
    .catch(() => {})
}

/** GoWork-style radios hide the native input (`opacity: 0`). */
export async function checkOrClickInput(
  page: Page,
  locator: ReturnType<Page['locator']>,
  options: BrowserStepOptions,
) {
  const input = locator.first()

  await input.waitFor({
    state: 'attached',
    timeout: STEP_TIMEOUT_MS,
  })

  const inputId = await input.getAttribute('id')

  // Browser Run can hang inside `check()` without rejecting — prefer DOM click.
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

  await input.check({
    timeout: STEP_TIMEOUT_MS,
    force: options.forceClick || true,
  })
}
