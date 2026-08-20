export const STEP_TIMEOUT_MS = 30_000
export const NAVIGATION_TIMEOUT_MS = 30_000
export const MAX_WAIT_TIMEOUT_MS = 60_000
export const HTTP_STEP_TIMEOUT_MS = 180_000
export const STEP_TIMEOUT_GRACE_MS = 5_000
export const MAX_RUN_DURATION_MS = 10 * 60 * 1000
export const CANCEL_POLL_MS = 1_000

export const STALE_RUN_ERROR =
  'Run timed out. The browser session ended before this step finished.'

export const CANCELLED_RUN_ERROR = 'Cancelled'

export class RunCancelledError extends Error {
  readonly name = 'RunCancelledError'

  constructor(message = CANCELLED_RUN_ERROR) {
    super(message)
  }
}
