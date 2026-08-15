import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { createServerEntry } from '@tanstack/react-start/server-entry'

import { runWithDbConnection } from '#/db/index.ts'
import { runWithExecutionContext } from '#/server/cloudflare/execution-context.ts'

const handler = createStartHandler(defaultStreamHandler)

type CloudflareExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void
}

export default createServerEntry({
  fetch(
    request: Request,
    _env?: unknown,
    ctx?: CloudflareExecutionContext,
  ) {
    return runWithDbConnection(() => {
      if (ctx?.waitUntil) {
        return runWithExecutionContext(ctx, () => handler(request))
      }

      return handler(request)
    })
  },
})
