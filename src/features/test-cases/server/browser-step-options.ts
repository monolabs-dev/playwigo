import type { StepConfigJson } from '#/features/test-cases/types/step-config.ts'

export type BrowserStepRetry = {
  attempts: number
  intervalMs: number
}

export type BrowserStepOptions = {
  retry: BrowserStepRetry | null
  forceClick: boolean
  /** Wait for open dialog and prefer matching inside it (modal buttons). */
  scopeToDialog: boolean
  /** Extra ms after the target is visible (modal enter animations). */
  settleBeforeMs: number
}

const DEFAULT_CLICK_SETTLE_MS = 350

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

function asSettleBeforeMs(value: unknown, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(3_000, Math.max(0, Math.floor(value)))
}

/** Optional `config` on click/goto/wait steps. */
export function readBrowserStepOptions(
  config: StepConfigJson | unknown,
  action?: string,
): BrowserStepOptions {
  const clickDefaults =
    action === 'click'
      ? {
          scopeToDialog: true,
          settleBeforeMs: DEFAULT_CLICK_SETTLE_MS,
        }
      : {
          scopeToDialog: false,
          settleBeforeMs: 0,
        }

  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    return {
      retry: null,
      forceClick: false,
      ...clickDefaults,
    }
  }

  const record = config as Record<string, unknown>

  if ('method' in record && 'url' in record) {
    return {
      retry: null,
      forceClick: false,
      scopeToDialog: false,
      settleBeforeMs: 0,
    }
  }

  if ('name' in record && 'value' in record) {
    return {
      retry: null,
      forceClick: false,
      scopeToDialog: false,
      settleBeforeMs: 0,
    }
  }

  const retry = asRetry(record.retry)
  const forceClick = record.forceClick === true
  const scopeToDialog =
    record.scopeToDialog === false
      ? false
      : record.scopeToDialog === true
        ? true
        : clickDefaults.scopeToDialog
  const settleBeforeMs = asSettleBeforeMs(
    record.settleBeforeMs,
    clickDefaults.settleBeforeMs,
  )

  return { retry, forceClick, scopeToDialog, settleBeforeMs }
}
