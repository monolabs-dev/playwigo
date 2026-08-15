import { AsyncLocalStorage } from 'node:async_hooks'

type CloudflareExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void
}

const storage = new AsyncLocalStorage<CloudflareExecutionContext>()

export function runWithExecutionContext<T>(
  ctx: CloudflareExecutionContext,
  fn: () => T,
): T {
  return storage.run(ctx, fn)
}

export function scheduleBackgroundWork(work: Promise<unknown>) {
  const ctx = storage.getStore()

  if (ctx) {
    ctx.waitUntil(work)
    return
  }

  void work.catch((error: unknown) => {
    console.error('Background task failed', error)
  })
}
