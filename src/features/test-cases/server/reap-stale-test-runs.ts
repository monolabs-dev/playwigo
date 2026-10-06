import { and, eq, inArray, lt, sql } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { testRunSteps, testRuns } from '#/db/schema.ts'
import {
  MAX_RUN_DURATION_MS,
  MAX_STEP_RUNNING_MS,
  STEP_STALE_ERROR,
  STALE_RUN_ERROR,
} from '#/features/test-cases/server/run-limits.ts'

async function reapStuckRunningSteps() {
  const stepCutoff = new Date(Date.now() - MAX_STEP_RUNNING_MS)

  const stuckSteps = await db
    .select({
      testRunId: testRunSteps.testRunId,
    })
    .from(testRunSteps)
    .innerJoin(testRuns, eq(testRuns.id, testRunSteps.testRunId))
    .where(
      and(
        eq(testRunSteps.status, 'running'),
        inArray(testRuns.status, ['queued', 'running']),
        lt(testRunSteps.updatedAt, stepCutoff),
      ),
    )

  if (stuckSteps.length === 0) {
    return
  }

  const runIds = [...new Set(stuckSteps.map((row) => row.testRunId))]
  const now = new Date()

  await db
    .update(testRunSteps)
    .set({
      status: 'failed',
      errorMessage: STEP_STALE_ERROR,
    })
    .where(
      and(
        inArray(testRunSteps.testRunId, runIds),
        eq(testRunSteps.status, 'running'),
      ),
    )

  for (const testRunId of runIds) {
    const run = (
      await db
        .select({
          startedAt: testRuns.startedAt,
          queuedAt: testRuns.queuedAt,
          createdAt: testRuns.createdAt,
        })
        .from(testRuns)
        .where(eq(testRuns.id, testRunId))
        .limit(1)
    ).at(0)

    if (!run) {
      continue
    }

    const started = run.startedAt ?? run.queuedAt ?? run.createdAt

    await db
      .update(testRuns)
      .set({
        status: 'error',
        completedAt: now,
        durationMs: Math.max(0, now.getTime() - started.getTime()),
        errorMessage: STEP_STALE_ERROR,
      })
      .where(
        and(
          eq(testRuns.id, testRunId),
          inArray(testRuns.status, ['queued', 'running']),
        ),
      )
  }
}

export async function reapStaleTestRuns() {
  await reapStuckRunningSteps()

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
