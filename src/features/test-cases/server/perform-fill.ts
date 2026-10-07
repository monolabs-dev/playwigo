import type { Locator } from '@cloudflare/playwright'

import {
  delay,
  withWallClock,
} from '#/features/test-cases/server/bounded-playwright.ts'

const FILL_WAIT_MS = 10_000

export async function performFill(locator: Locator, value: string) {
  const target = locator.locator('visible=true').first()

  await withWallClock(
    target.waitFor({ state: 'visible', timeout: FILL_WAIT_MS }),
    FILL_WAIT_MS + 500,
    `Timed out after ${FILL_WAIT_MS / 1000}s waiting for a visible fill target.`,
  )

  const filledWithPlaywright = await withWallClock(
    target.fill(value, { timeout: FILL_WAIT_MS }).then(() => true),
    FILL_WAIT_MS + 500,
    'fill timed out',
  ).catch(() => false)

  if (filledWithPlaywright) {
    return
  }

  await withWallClock(
    target.evaluate((el, nextValue) => {
      if (!(el instanceof HTMLElement)) {
        throw new Error('Fill target is not an HTML element')
      }

      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement
      ) {
        el.value = nextValue
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        return
      }

      if (el.isContentEditable) {
        el.textContent = nextValue
        el.dispatchEvent(new Event('input', { bubbles: true }))
        return
      }

      throw new Error(
        'Fill target is not an input, textarea, or contenteditable element.',
      )
    }, value),
    FILL_WAIT_MS + 500,
    'DOM fill timed out',
  )

  await delay(50)
}
