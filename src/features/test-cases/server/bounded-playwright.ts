/**
 * Cloudflare Browser Run can leave Playwright CDP calls pending forever (no reject).
 * Wall-clock races turn those into bounded failures the step runner can surface.
 */

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function withWallClock<T>(
  work: Promise<T>,
  budgetMs: number,
  timeoutMessage: string,
): Promise<T> {
  let settled = false
  void work.catch(() => {})

  try {
    return await Promise.race([
      work.then((value) => {
        settled = true
        return value
      }),
      delay(budgetMs).then(() => {
        if (settled) {
          return undefined as T
        }
        throw new Error(timeoutMessage)
      }),
    ])
  } finally {
    settled = true
  }
}
