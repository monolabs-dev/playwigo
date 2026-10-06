import { expect } from '@cloudflare/playwright/test'
import type { Page } from '@cloudflare/playwright'
import { launch } from '@cloudflare/playwright'
import { env } from 'cloudflare:workers'

import type { TestCaseStep } from '#/features/test-cases/types/test-case.ts'
import type {
  ExtractTextConfig,
  HttpRequestConfig,
  SetVariableConfig,
  TestCaseStepAction,
} from '#/features/test-cases/utils/step-actions.ts'
import {
  formatSelectorQuery,
  normalizeSelectorType,
  normalizeStepAction,
} from '#/features/test-cases/utils/step-actions.ts'
import { maskResolvedStepValue } from '#/features/test-cases/server/run-variables.ts'
import type { RunVariableContext } from '#/features/test-cases/server/run-variables.ts'
import {
  BROWSER_CLOSE_TIMEOUT_MS,
  CANCEL_POLL_MS,
  CANCELLED_RUN_ERROR,
  GOTO_STEP_TIMEOUT_MS,
  HTTP_STEP_TIMEOUT_MS,
  MAX_RUN_DURATION_MS,
  MAX_WAIT_TIMEOUT_MS,
  NAVIGATION_TIMEOUT_MS,
  PAGE_SETTLE_TIMEOUT_MS,
  RunCancelledError,
  STEP_TIMEOUT_GRACE_MS,
  STEP_TIMEOUT_MS,
} from '#/features/test-cases/server/run-limits.ts'
import { putTestRunScreenshot } from '#/server/integrations/r2/screenshots.ts'
import { readBrowserStepOptions } from '#/features/test-cases/server/browser-step-options.ts'
import { executeStepHttpRequest } from '#/server/integrations/http/step-request.ts'

export type ExecutedStepResult = {
  testCaseStepId: string | null
  sortOrder: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  resolvedValue: string | null
  status: 'passed' | 'failed' | 'cancelled'
  durationMs: number
  errorMessage: string | null
  screenshotUrl: string | null
}

export type ExecuteTestCaseResult = {
  status: 'passed' | 'failed' | 'error' | 'cancelled'
  durationMs: number
  errorMessage: string | null
  steps: ExecutedStepResult[]
  resolvedVariables: Record<string, string>
}

export type ExecuteTestCaseProgress = {
  onStepStart?: (step: TestCaseStep, index: number) => Promise<void>
  onStepComplete?: (
    step: TestCaseStep,
    index: number,
    result: ExecutedStepResult,
  ) => Promise<void>
  shouldAbort?: () => Promise<boolean>
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function stepBudgetMs(action: TestCaseStepAction) {
  if (action === 'httpRequest') {
    return HTTP_STEP_TIMEOUT_MS
  }

  if (action === 'goto') {
    return GOTO_STEP_TIMEOUT_MS
  }

  if (action === 'waitTimeout' || action === 'wait') {
    return MAX_WAIT_TIMEOUT_MS
  }

  return STEP_TIMEOUT_MS
}

async function raceStep<T>(
  work: Promise<T>,
  options: {
    timeoutMs: number
    timeoutMessage: string
    shouldAbort?: () => Promise<boolean>
    onAbort?: () => Promise<void>
  },
) {
  let settled = false
  void work.catch(() => {})

  const timeoutPromise = delay(options.timeoutMs).then(async () => {
    if (settled) {
      return undefined as T
    }

    await options.onAbort?.()
    throw new Error(options.timeoutMessage)
  })

  const abortPromise = (async () => {
    if (!options.shouldAbort) {
      await new Promise<never>(() => {})
    }

    // settled is written when Promise.race completes in the outer try/finally.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (!settled) {
      if (await options.shouldAbort?.()) {
        await options.onAbort?.()
        throw new RunCancelledError()
      }

      await delay(CANCEL_POLL_MS)
    }

    return undefined as T
  })()

  try {
    return await Promise.race([work, timeoutPromise, abortPromise])
  } finally {
    settled = true
  }
}

function resolveLocator(
  page: Page,
  selectorType: string | null,
  selector: string,
) {
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
    timeout: 10_000,
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

function asSetVariableConfig(config: unknown): SetVariableConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('setVariable requires config { name, value }')
  }

  const record = config as Record<string, unknown>
  if (typeof record.name !== 'string' || typeof record.value !== 'string') {
    throw new Error('setVariable requires config { name, value }')
  }

  return { name: record.name, value: record.value }
}

function asExtractTextConfig(config: unknown): ExtractTextConfig {
  if (config == null) {
    return {}
  }

  if (typeof config !== 'object') {
    throw new Error('extractText config is invalid')
  }

  const record = config as Record<string, unknown>
  return {
    attribute: typeof record.attribute === 'string' ? record.attribute : null,
    regex: typeof record.regex === 'string' ? record.regex : null,
  }
}

function asHttpRequestConfig(config: unknown): HttpRequestConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('httpRequest requires a config object')
  }

  const record = config as Record<string, unknown>
  const method = record.method
  const url = record.url

  if (
    method !== 'GET' &&
    method !== 'POST' &&
    method !== 'PUT' &&
    method !== 'PATCH' &&
    method !== 'DELETE'
  ) {
    throw new Error('httpRequest requires a valid method')
  }

  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('httpRequest requires a url')
  }

  return {
    method,
    url,
    headers:
      record.headers && typeof record.headers === 'object'
        ? (record.headers as Record<string, string>)
        : null,
    body: typeof record.body === 'string' ? record.body : null,
    jsonPath: typeof record.jsonPath === 'string' ? record.jsonPath : null,
    regex: typeof record.regex === 'string' ? record.regex : null,
    expectStatus:
      typeof record.expectStatus === 'number' ? record.expectStatus : null,
    retry:
      record.retry && typeof record.retry === 'object'
        ? (record.retry as { attempts: number; intervalMs: number })
        : null,
  }
}

function applyRegexCapture(raw: string, pattern: string) {
  const match = new RegExp(pattern).exec(raw)
  if (!match) {
    throw new Error(`Regex did not match extracted text: /${pattern}/`)
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return match[1] ?? match[0]
}

async function waitForPageSettled(page: Page) {
  await page
    .waitForLoadState('load', { timeout: PAGE_SETTLE_TIMEOUT_MS })
    .catch(() => {})
}

async function navigateToPage(page: Page, url: string) {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: NAVIGATION_TIMEOUT_MS,
  })
  await waitForPageSettled(page)
}

/** Jakarta default — GoWork booking pages call `getCurrentPosition` on load. */
const DEFAULT_RUN_GEOLOCATION = {
  latitude: -6.2088,
  longitude: 106.8456,
  accuracy: 100,
}

function resolveRunOrigin(
  steps: TestCaseStep[],
  baseUrl: string | null,
): string | null {
  if (baseUrl) {
    try {
      return new URL(baseUrl).origin
    } catch {
      // fall through
    }
  }

  for (const step of steps) {
    if (normalizeStepAction(step.action) !== 'goto') {
      continue
    }
    const url = step.value?.trim()
    if (!url) {
      continue
    }
    try {
      return new URL(url).origin
    } catch {
      continue
    }
  }

  return null
}

async function grantAutomationPermissions(page: Page, origin: string) {
  const context = page.context()

  try {
    await context.grantPermissions(['geolocation', 'notifications'], {
      origin,
    })
    await context.setGeolocation(DEFAULT_RUN_GEOLOCATION)
  } catch {
    // Remote Browser Run may not support every permission; runs should continue.
  }
}

async function executeStep(
  page: Page,
  step: TestCaseStep,
  variables: RunVariableContext,
  stepIndex: number,
) {
  const action = normalizeStepAction(step.action) satisfies TestCaseStepAction
  const selectorTemplate = step.selector?.trim() ?? ''
  const valueTemplate = step.value?.trim() ?? ''

  const selector =
    variables.resolve(selectorTemplate, { stepIndex })?.trim() ?? ''
  const value = variables.resolve(valueTemplate, { stepIndex })?.trim() ?? ''

  let producedValue: string | null = null

  switch (action) {
    case 'goto':
      await navigateToPage(page, value)
      break
    case 'click': {
      const { forceClick } = readBrowserStepOptions(step.config)
      const clickTarget = resolveLocator(page, step.selectorType, selector)
      await clickTarget.scrollIntoViewIfNeeded({
        timeout: STEP_TIMEOUT_MS,
      })
      await clickTarget.click({
        timeout: STEP_TIMEOUT_MS,
        force: forceClick,
      })
      await waitForPageSettled(page)
      break
    }
    case 'fill':
      await resolveLocator(page, step.selectorType, selector).fill(value, {
        timeout: STEP_TIMEOUT_MS,
      })
      break
    case 'select':
      await resolveLocator(page, step.selectorType, selector).selectOption(
        value,
        { timeout: STEP_TIMEOUT_MS },
      )
      break
    case 'check':
      await resolveLocator(page, step.selectorType, selector).check({
        timeout: STEP_TIMEOUT_MS,
      })
      break
    case 'uncheck':
      await resolveLocator(page, step.selectorType, selector).uncheck({
        timeout: STEP_TIMEOUT_MS,
      })
      break
    case 'hover':
      await resolveLocator(page, step.selectorType, selector).hover({
        timeout: STEP_TIMEOUT_MS,
      })
      break
    case 'wait':
      await resolveLocator(page, step.selectorType, selector).waitFor({
        timeout: MAX_WAIT_TIMEOUT_MS,
      })
      break
    case 'waitTimeout': {
      const requestedMs = Number(value)
      if (!Number.isFinite(requestedMs) || requestedMs < 0) {
        throw new Error('waitTimeout requires a duration in milliseconds')
      }

      await page.waitForTimeout(Math.min(requestedMs, MAX_WAIT_TIMEOUT_MS))
      break
    }
    case 'pressKey':
      await page.keyboard.press(value)
      break
    case 'expectToHaveUrl':
      await expect(page).toHaveURL(value, { timeout: STEP_TIMEOUT_MS })
      break
    case 'expectToHaveTitle':
      await expect(page).toHaveTitle(value, { timeout: STEP_TIMEOUT_MS })
      break
    case 'expectToHaveText':
      await expect(
        resolveLocator(page, step.selectorType, selector),
      ).toHaveText(value, { timeout: STEP_TIMEOUT_MS })
      break
    case 'expectToContainText':
      await expect(
        resolveLocator(page, step.selectorType, selector),
      ).toContainText(value, { timeout: STEP_TIMEOUT_MS })
      break
    case 'setVariable': {
      const config = asSetVariableConfig(step.config)
      const resolvedName = variables.resolve(config.name, { stepIndex })
      const resolvedValue = variables.resolve(config.value, { stepIndex }) ?? ''
      if (!resolvedName) {
        throw new Error('setVariable name resolved to an empty string')
      }
      variables.set(resolvedName, resolvedValue)
      producedValue = resolvedValue
      break
    }
    case 'extractText': {
      const outputVariable = step.outputVariable?.trim()
      if (!outputVariable) {
        throw new Error('extractText requires outputVariable')
      }

      const config = asExtractTextConfig(step.config)
      const locator = resolveLocator(page, step.selectorType, selector)
      let raw =
        config.attribute && config.attribute.trim().length > 0
          ? ((await locator.getAttribute(config.attribute.trim(), {
              timeout: STEP_TIMEOUT_MS,
            })) ?? '')
          : await locator.innerText({ timeout: STEP_TIMEOUT_MS })

      raw = raw.trim()
      if (!raw) {
        throw new Error('extractText found an empty value')
      }

      const extracted = config.regex
        ? applyRegexCapture(raw, config.regex)
        : raw
      variables.set(outputVariable, extracted)
      producedValue = extracted
      break
    }
    case 'httpRequest': {
      const outputVariable = step.outputVariable?.trim()
      if (!outputVariable) {
        throw new Error('httpRequest requires outputVariable')
      }

      const config = asHttpRequestConfig(step.config)
      const resolvedUrl =
        variables.resolve(config.url, { stepIndex })?.trim() ?? ''
      const resolvedBody = config.body
        ? (variables.resolve(config.body, { stepIndex }) ?? null)
        : null

      const resolvedHeaders: Record<string, string> = {}
      if (config.headers) {
        for (const [key, headerValue] of Object.entries(config.headers)) {
          resolvedHeaders[key] =
            variables.resolve(headerValue, { stepIndex }) ?? ''
        }
      }

      const extracted = await executeStepHttpRequest({
        ...config,
        url: resolvedUrl,
        body: resolvedBody,
        headers:
          Object.keys(resolvedHeaders).length > 0 ? resolvedHeaders : null,
      })

      variables.set(outputVariable, extracted)
      producedValue = extracted
      break
    }
    default:
      throw new Error(`Unsupported step action: ${action}`)
  }

  const displayResolved =
    producedValue ??
    (valueTemplate.length > 0
      ? value
      : selectorTemplate.length > 0
        ? selector
        : null)

  return {
    resolvedValue: maskResolvedStepValue(
      producedValue != null
        ? (step.outputVariable ?? valueTemplate)
        : valueTemplate || selectorTemplate,
      displayResolved,
    ),
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
  variables: RunVariableContext
  loginPreludeStepCount?: number
  progress?: ExecuteTestCaseProgress
}) {
  if (!('BROWSER' in env) || !env.BROWSER) {
    throw new Error(
      'Browser Run is not configured. Add a browser binding to wrangler.jsonc.',
    )
  }

  const {
    steps,
    baseUrl,
    testRunId,
    variables,
    loginPreludeStepCount = 0,
    progress,
  } = input

  if (steps.length === 0) {
    throw new Error('Add at least one step before running this test case.')
  }

  if (baseUrl) {
    variables.set('baseUrl', baseUrl)
  }

  const startedAt = Date.now()
  const executedSteps: ExecutedStepResult[] = []
  let browser: Awaited<ReturnType<typeof launch>> | null = null
  let browserClosed = false

  async function closeBrowser() {
    if (!browser || browserClosed) {
      return
    }

    browserClosed = true
    await Promise.race([
      browser.close().catch(() => {}),
      delay(BROWSER_CLOSE_TIMEOUT_MS),
    ])
  }

  async function throwIfAborted() {
    if (await progress?.shouldAbort?.()) {
      throw new RunCancelledError()
    }
  }

  try {
    browser = await launch(env.BROWSER)
    const page = await browser.newPage()
    page.setDefaultTimeout(STEP_TIMEOUT_MS)
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS)

    const runOrigin = resolveRunOrigin(steps, baseUrl)
    if (runOrigin) {
      await grantAutomationPermissions(page, runOrigin)
    }

    const firstAction = normalizeStepAction(steps[0]?.action)
    if (baseUrl && loginPreludeStepCount === 0 && firstAction !== 'goto') {
      await navigateToPage(page, baseUrl)
    }

    for (const [index, step] of steps.entries()) {
      if (Date.now() - startedAt > MAX_RUN_DURATION_MS) {
        throw new Error(
          `Run exceeded the ${MAX_RUN_DURATION_MS / 60_000} minute limit.`,
        )
      }

      await throwIfAborted()

      const stepStartedAt = Date.now()
      const action = normalizeStepAction(step.action)
      const budgetMs = stepBudgetMs(action)

      await progress?.onStepStart?.(step, index)

      const browserOptions = readBrowserStepOptions(step.config)
      const retry = browserOptions.retry
      const maxAttempts = retry?.attempts ?? 1

      try {
        let resolvedValue: string | null = null

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          await throwIfAborted()

          try {
            const result = await raceStep(
              executeStep(page, step, variables, index),
              {
                timeoutMs: budgetMs + STEP_TIMEOUT_GRACE_MS,
                timeoutMessage: `Step timed out after ${Math.round(budgetMs / 1000)}s (${step.action}).`,
                shouldAbort: progress?.shouldAbort,
                onAbort: closeBrowser,
              },
            )
            resolvedValue = result.resolvedValue
            break
          } catch (error) {
            const cancelled = error instanceof RunCancelledError
            if (
              cancelled ||
              attempt >= maxAttempts ||
              maxAttempts <= 1
            ) {
              throw error
            }

            await delay(retry!.intervalMs)
          }
        }

        if (loginPreludeStepCount > 0 && index === loginPreludeStepCount - 1) {
          await waitForPageSettled(page)
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
          resolvedValue,
          status: 'passed' as const,
          durationMs: Date.now() - stepStartedAt,
          errorMessage: null,
          screenshotUrl,
        } satisfies ExecutedStepResult

        executedSteps.push(passedStep)
        await progress?.onStepComplete?.(step, index, passedStep)
      } catch (error) {
        const cancelled = error instanceof RunCancelledError
        const message = cancelled
          ? CANCELLED_RUN_ERROR
          : error instanceof Error
            ? error.message
            : 'Step execution failed'

        let screenshotUrl: string | null = null
        // browserClosed is set by closeBrowser() if the step was aborted.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled && !browserClosed) {
          try {
            screenshotUrl = await storeStepScreenshot(testRunId, step.id, page)
          } catch {
            screenshotUrl = null
          }
        }

        const finishedStep = {
          testCaseStepId: step.id,
          sortOrder: index,
          action: step.action,
          selector: step.selector,
          selectorType: step.selectorType,
          value: step.value,
          resolvedValue: null,
          status: cancelled ? ('cancelled' as const) : ('failed' as const),
          durationMs: Date.now() - stepStartedAt,
          errorMessage: message,
          screenshotUrl,
        } satisfies ExecutedStepResult

        executedSteps.push(finishedStep)
        await progress?.onStepComplete?.(step, index, finishedStep)

        return {
          status: cancelled ? 'cancelled' : 'failed',
          durationMs: Date.now() - startedAt,
          errorMessage: message,
          steps: executedSteps,
          resolvedVariables: variables.snapshot(),
        } satisfies ExecuteTestCaseResult
      }
    }

    return {
      status: 'passed',
      durationMs: Date.now() - startedAt,
      errorMessage: null,
      steps: executedSteps,
      resolvedVariables: variables.snapshot(),
    } satisfies ExecuteTestCaseResult
  } catch (error) {
    if (error instanceof RunCancelledError) {
      return {
        status: 'cancelled',
        durationMs: Date.now() - startedAt,
        errorMessage: CANCELLED_RUN_ERROR,
        steps: executedSteps,
        resolvedVariables: variables.snapshot(),
      } satisfies ExecuteTestCaseResult
    }

    return {
      status: 'error',
      durationMs: Date.now() - startedAt,
      errorMessage: formatBrowserRunError(error),
      steps: executedSteps,
      resolvedVariables: variables.snapshot(),
    } satisfies ExecuteTestCaseResult
  } finally {
    await closeBrowser()
  }
}
