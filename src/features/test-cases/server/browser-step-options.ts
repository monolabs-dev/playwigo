import type { StepConfigJson } from '#/features/test-cases/types/step-config.ts'

export type BrowserStepRetry = {
  attempts: number
  intervalMs: number
}

export type BrowserStepOptions = {
  retry: BrowserStepRetry | null
  forceClick: boolean
}

function asRetry(value: unknown): BrowserStepRetry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const attempts = record.attempts
  const intervalMs = record.intervalMs

  if (typeof attempts !== 'number' || typeof intervalMs !== 'number') {
    return null
  }

  return {
    attempts: Math.min(5, Math.max(1, Math.floor(attempts))),
    intervalMs: Math.min(10_000, Math.max(200, Math.floor(intervalMs))),
  }
}

/** Optional `config` on click/goto/wait steps: `{ retry?, forceClick? }`. */
export function readBrowserStepOptions(
  config: StepConfigJson | unknown,
): BrowserStepOptions {
  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    return { retry: null, forceClick: false }
  }

  const record = config as Record<string, unknown>

  if ('method' in record && 'url' in record) {
    return { retry: null, forceClick: false }
  }

  if ('name' in record && 'value' in record) {
    return { retry: null, forceClick: false }
  }

  const retry = asRetry(record.retry)
  const forceClick = record.forceClick === true

  return { retry, forceClick }
}
