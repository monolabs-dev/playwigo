import { expect } from '@cloudflare/playwright/test'
import type { Page } from '@cloudflare/playwright'
import { launch } from '@cloudflare/playwright'
import { env } from 'cloudflare:workers'

import type { TestCaseStep } from '#/features/test-cases/types/test-case.ts'
import type { TestCaseStepAction } from '#/features/test-cases/utils/step-actions.ts'
import {
  formatSelectorQuery,
  normalizeSelectorType,
  normalizeStepAction,
} from '#/features/test-cases/utils/step-actions.ts'
import { putTestRunScreenshot } from '#/server/integrations/r2/screenshots.ts'

export type ExecutedStepResult = {
  testCaseStepId: string | null
  sortOrder: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  status: 'passed' | 'failed'
  durationMs: number
  errorMessage: string | null
  screenshotUrl: string | null
}

export type ExecuteTestCaseResult = {
  status: 'passed' | 'failed' | 'error'
  durationMs: number
  errorMessage: string | null
  steps: ExecutedStepResult[]
}

export type ExecuteTestCaseProgress = {
  onStepStart?: (step: TestCaseStep, index: number) => Promise<void>
  onStepComplete?: (
    step: TestCaseStep,
    index: number,
    result: ExecutedStepResult,
  ) => Promise<void>
}

function resolveLocator(page: Page, selectorType: string | null, selector: string) {
  const type = normalizeSelectorType(selectorType)
  const query = formatSelectorQuery(type, selector)

  if (type === 'xpath') {
    return page.locator(`xpath=${query}`)
  }

  if (type === 'text') {
    return page.getByText(query, { exact: false })
  }

  return page.locator(query)
}

async function captureStepScreenshot(page: Page) {
  const bytes = await page.screenshot({
    type: 'jpeg',
    quality: 65,
    fullPage: false,
  })

  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
}

async function storeStepScreenshot(
  testRunId: string,
  testCaseStepId: string,
  page: Page,
) {
  try {
    const bytes = await captureStepScreenshot(page)
    return await putTestRunScreenshot(testRunId, testCaseStepId, bytes)
  } catch {
    return null
  }
}

async function executeStep(page: Page, step: TestCaseStep) {
  const action = normalizeStepAction(step.action) satisfies TestCaseStepAction
  const selector = step.selector?.trim() ?? ''
  const value = step.value?.trim() ?? ''

  switch (action) {
    case 'goto':
      await page.goto(value, { waitUntil: 'domcontentloaded' })
      return
    case 'click':
      await resolveLocator(page, step.selectorType, selector).click()
      return
    case 'fill':
      await resolveLocator(page, step.selectorType, selector).fill(value)
      return
    case 'select':
      await resolveLocator(page, step.selectorType, selector).selectOption(value)
      return
    case 'check':
      await resolveLocator(page, step.selectorType, selector).check()
      return
    case 'uncheck':
      await resolveLocator(page, step.selectorType, selector).uncheck()
      return
    case 'hover':
      await resolveLocator(page, step.selectorType, selector).hover()
      return
    case 'wait':
      await resolveLocator(page, step.selectorType, selector).waitFor()
      return
    case 'waitTimeout':
      await page.waitForTimeout(Number(value))
      return
    case 'pressKey':
      await page.keyboard.press(value)
      return
    case 'expectToHaveUrl':
      await expect(page).toHaveURL(value)
      return
    case 'expectToHaveTitle':
      await expect(page).toHaveTitle(value)
      return
    case 'expectToHaveText':
      await expect(
        resolveLocator(page, step.selectorType, selector),
      ).toHaveText(value)
      return
    case 'expectToContainText':
      await expect(
        resolveLocator(page, step.selectorType, selector),
      ).toContainText(value)
      return
    default:
      throw new Error(`Unsupported step action: ${action}`)
  }
}

function formatBrowserRunError(error: unknown) {
  const message =
    error instanceof Error ? error.message : 'Unable to run test case'

  if (message.includes('fs.mkdtemp') || message.includes('connectOverCDP')) {
    return 'Browser Run needs a recent compatibility_date (2025-09-15+) and remote browser binding. Restart the dev server after updating wrangler.jsonc, and run wrangler login if needed.'
  }

  if (message.includes('Screenshots R2 bucket')) {
    return 'Screenshots bucket is not configured. Create the R2 bucket and restart the dev server.'
  }

  return message
}

export async function executeTestCaseSteps(input: {
  steps: TestCaseStep[]
  baseUrl: string | null
  testRunId: string
  loginPreludeStepCount?: number
  progress?: ExecuteTestCaseProgress
}) {
  if (!('BROWSER' in env) || !env.BROWSER) {
    throw new Error(
      'Browser Run is not configured. Add a browser binding to wrangler.jsonc.',
    )
  }

  const { steps, baseUrl, testRunId, loginPreludeStepCount = 0, progress } =
    input

  if (steps.length === 0) {
    throw new Error('Add at least one step before running this test case.')
  }

  const startedAt = Date.now()
  const executedSteps: ExecutedStepResult[] = []
  let browser: Awaited<ReturnType<typeof launch>> | null = null

  try {
    browser = await launch(env.BROWSER)
    const page = await browser.newPage()

    const firstAction = normalizeStepAction(steps[0]?.action)
    if (
      baseUrl &&
      loginPreludeStepCount === 0 &&
      firstAction !== 'goto'
    ) {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    }

    for (const [index, step] of steps.entries()) {
      const stepStartedAt = Date.now()

      await progress?.onStepStart?.(step, index)

      try {
        await executeStep(page, step)

        if (
          loginPreludeStepCount > 0 &&
          index === loginPreludeStepCount - 1
        ) {
          await page.waitForLoadState('networkidle').catch(() => {})
        }

        const screenshotUrl = await storeStepScreenshot(
          testRunId,
          step.id,
          page,
        )

        const passedStep = {
          testCaseStepId: step.id,
          sortOrder: index,
          action: step.action,
          selector: step.selector,
          selectorType: step.selectorType,
          value: step.value,
          status: 'passed',
          durationMs: Date.now() - stepStartedAt,
          errorMessage: null,
          screenshotUrl,
        } satisfies ExecutedStepResult

        executedSteps.push(passedStep)
        await progress?.onStepComplete?.(step, index, passedStep)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Step execution failed'

        let screenshotUrl: string | null = null
        try {
          screenshotUrl = await storeStepScreenshot(
            testRunId,
            step.id,
            page,
          )
        } catch {
          screenshotUrl = null
        }

        const failedStep = {
          testCaseStepId: step.id,
          sortOrder: index,
          action: step.action,
          selector: step.selector,
          selectorType: step.selectorType,
          value: step.value,
          status: 'failed',
          durationMs: Date.now() - stepStartedAt,
          errorMessage: message,
          screenshotUrl,
        } satisfies ExecutedStepResult

        executedSteps.push(failedStep)
        await progress?.onStepComplete?.(step, index, failedStep)

        return {
          status: 'failed',
          durationMs: Date.now() - startedAt,
          errorMessage: message,
          steps: executedSteps,
        } satisfies ExecuteTestCaseResult
      }
    }

    return {
      status: 'passed',
      durationMs: Date.now() - startedAt,
      errorMessage: null,
      steps: executedSteps,
    } satisfies ExecuteTestCaseResult
  } catch (error) {
    return {
      status: 'error',
      durationMs: Date.now() - startedAt,
      errorMessage: formatBrowserRunError(error),
      steps: executedSteps,
    } satisfies ExecuteTestCaseResult
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}
