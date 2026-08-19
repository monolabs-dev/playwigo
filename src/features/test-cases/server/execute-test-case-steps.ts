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
import {
  maskResolvedStepValue

} from '#/features/test-cases/server/run-variables.ts'
import type {RunVariableContext} from '#/features/test-cases/server/run-variables.ts';
import { putTestRunScreenshot } from '#/server/integrations/r2/screenshots.ts'
import { executeStepHttpRequest } from '#/server/integrations/http/step-request.ts'

export type ExecutedStepResult = {
  testCaseStepId: string | null
  sortOrder: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  resolvedValue: string | null
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
  resolvedVariables: Record<string, string>
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
    attribute:
      typeof record.attribute === 'string' ? record.attribute : null,
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
      await page.goto(value, { waitUntil: 'domcontentloaded' })
      break
    case 'click':
      await resolveLocator(page, step.selectorType, selector).click()
      break
    case 'fill':
      await resolveLocator(page, step.selectorType, selector).fill(value)
      break
    case 'select':
      await resolveLocator(page, step.selectorType, selector).selectOption(value)
      break
    case 'check':
      await resolveLocator(page, step.selectorType, selector).check()
      break
    case 'uncheck':
      await resolveLocator(page, step.selectorType, selector).uncheck()
      break
    case 'hover':
      await resolveLocator(page, step.selectorType, selector).hover()
      break
    case 'wait':
      await resolveLocator(page, step.selectorType, selector).waitFor()
      break
    case 'waitTimeout':
      await page.waitForTimeout(Number(value))
      break
    case 'pressKey':
      await page.keyboard.press(value)
      break
    case 'expectToHaveUrl':
      await expect(page).toHaveURL(value)
      break
    case 'expectToHaveTitle':
      await expect(page).toHaveTitle(value)
      break
    case 'expectToHaveText':
      await expect(
        resolveLocator(page, step.selectorType, selector),
      ).toHaveText(value)
      break
    case 'expectToContainText':
      await expect(
        resolveLocator(page, step.selectorType, selector),
      ).toContainText(value)
      break
    case 'setVariable': {
      const config = asSetVariableConfig(step.config)
      const resolvedName = variables.resolve(config.name, { stepIndex })
      const resolvedValue =
        variables.resolve(config.value, { stepIndex }) ?? ''
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
          ? ((await locator.getAttribute(config.attribute.trim())) ?? '')
          : await locator.innerText()

      raw = raw.trim()
      if (!raw) {
        throw new Error('extractText found an empty value')
      }

      const extracted = config.regex ? applyRegexCapture(raw, config.regex) : raw
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
        headers: Object.keys(resolvedHeaders).length > 0 ? resolvedHeaders : null,
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
    (valueTemplate.length > 0 ? value : selectorTemplate.length > 0 ? selector : null)

  return {
    resolvedValue: maskResolvedStepValue(
      producedValue != null
        ? step.outputVariable ?? valueTemplate
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
        const { resolvedValue } = await executeStep(
          page,
          step,
          variables,
          index,
        )

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
          resolvedValue,
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
          resolvedValue: null,
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
    return {
      status: 'error',
      durationMs: Date.now() - startedAt,
      errorMessage: formatBrowserRunError(error),
      steps: executedSteps,
      resolvedVariables: variables.snapshot(),
    } satisfies ExecuteTestCaseResult
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}
