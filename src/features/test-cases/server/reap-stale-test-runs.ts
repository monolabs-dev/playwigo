import { and, eq, inArray, lt, sql } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { testRunSteps, testRuns } from '#/db/schema.ts'
import {
  MAX_RUN_DURATION_MS,
  STALE_RUN_ERROR,
} from '#/features/test-cases/server/run-limits.ts'

export async function reapStaleTestRuns() {
  const cutoff = new Date(Date.now() - MAX_RUN_DURATION_MS)

  const stale = await db
    .select({
      id: testRuns.id,
      startedAt: testRuns.startedAt,
      queuedAt: testRuns.queuedAt,
      createdAt: testRuns.createdAt,
    })
    .from(testRuns)
    .where(
      and(
        inArray(testRuns.status, ['queued', 'running']),
        lt(
          sql`coalesce(${testRuns.startedAt}, ${testRuns.queuedAt}, ${testRuns.createdAt})`,
          cutoff,
        ),
      ),
    )

  if (stale.length === 0) {
    return
  }

  const now = new Date()
  const ids = stale.map((run) => run.id)

  for (const run of stale) {
    const started = run.startedAt ?? run.queuedAt ?? run.createdAt

    await db
      .update(testRuns)
      .set({
        status: 'error',
        completedAt: now,
        durationMs: Math.max(0, now.getTime() - started.getTime()),
        errorMessage: STALE_RUN_ERROR,
      })
      .where(
        and(
          eq(testRuns.id, run.id),
          inArray(testRuns.status, ['queued', 'running']),
        ),
      )
  }

  await db
    .update(testRunSteps)
    .set({
      status: 'failed',
      errorMessage: STALE_RUN_ERROR,
    })
    .where(
      and(
        inArray(testRunSteps.testRunId, ids),
        eq(testRunSteps.status, 'running'),
      ),
    )
}
