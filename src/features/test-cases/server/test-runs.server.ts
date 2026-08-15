import { and, asc, eq, inArray } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { testRunSteps, testRuns } from '#/db/schema.ts'
import {
  executeTestCaseSteps,
} from '#/features/test-cases/server/execute-test-case-steps.ts'
import type { ExecutedStepResult } from '#/features/test-cases/server/execute-test-case-steps.ts'
import {
  getTestCaseSummary,
  listOwnedTestCaseStepDefinitions,
  requireOwnedTestCase,
} from '#/features/test-cases/server/test-cases.server.ts'
import type { TestRunStatus } from '#/features/test-cases/types/test-case.ts'
import { scheduleBackgroundWork } from '#/server/cloudflare/execution-context.ts'

async function findActiveTestRun(testCaseId: string) {
  return (
    await db
      .select({ id: testRuns.id })
      .from(testRuns)
      .where(
        and(
          eq(testRuns.testCaseId, testCaseId),
          inArray(testRuns.status, ['queued', 'running']),
        ),
      )
      .limit(1)
  ).at(0)
}

async function updateTestRunStep(
  testRunId: string,
  testCaseStepId: string,
  values: {
    status: 'running' | 'passed' | 'failed'
    durationMs?: number
    errorMessage?: string | null
    screenshotUrl?: string | null
  },
) {
  await db
    .update(testRunSteps)
    .set(values)
    .where(
      and(
        eq(testRunSteps.testRunId, testRunId),
        eq(testRunSteps.testCaseStepId, testCaseStepId),
      ),
    )
}

export async function executeOwnedTestCaseRun(testRunId: string) {
  const testRun = (
    await db
      .select({
        id: testRuns.id,
        testCaseId: testRuns.testCaseId,
        startedAt: testRuns.startedAt,
      })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1)
  ).at(0)

  if (!testRun) {
    return
  }

  const owned = await requireOwnedTestCase(testRun.testCaseId)
  const steps = await listOwnedTestCaseStepDefinitions(testRun.testCaseId)

  if (steps.length === 0) {
    await db
      .update(testRuns)
      .set({
        status: 'error',
        completedAt: new Date(),
        durationMs: 0,
        errorMessage: 'Add at least one step before running this test case.',
      })
      .where(eq(testRuns.id, testRunId))
    return
  }

  const result = await executeTestCaseSteps({
    steps: steps.map((step) => ({
      ...step,
      screenshotUrl: null,
      runStatus: null,
      errorMessage: null,
    })),
    baseUrl: owned.baseUrl,
    testRunId,
    progress: {
      onStepStart: async (step) => {
        await updateTestRunStep(testRunId, step.id, { status: 'running' })
      },
      onStepComplete: async (step, _index, stepResult: ExecutedStepResult) => {
        await updateTestRunStep(testRunId, step.id, {
          status: stepResult.status,
          durationMs: stepResult.durationMs,
          errorMessage: stepResult.errorMessage,
          screenshotUrl: stepResult.screenshotUrl,
        })
      },
    },
  })

  await db
    .update(testRuns)
    .set({
      status: result.status,
      completedAt: new Date(),
      durationMs: result.durationMs,
      errorMessage: result.errorMessage,
    })
    .where(eq(testRuns.id, testRunId))
}

export async function startOwnedTestCaseRun(testCaseId: string) {
  const owned = await requireOwnedTestCase(testCaseId)
  const steps = await listOwnedTestCaseStepDefinitions(testCaseId)

  if (steps.length === 0) {
    throw new Error('Add at least one step before running this test case.')
  }

  const activeRun = await findActiveTestRun(testCaseId)
  if (activeRun) {
    throw new Error('This test case is already running.')
  }

  const [testRun] = await db
    .insert(testRuns)
    .values({
      testCaseId,
      testAccountId: owned.testAccountId,
      status: 'running',
      queuedAt: new Date(),
      startedAt: new Date(),
    })
    .returning({ id: testRuns.id })

  await db.insert(testRunSteps).values(
    steps.map((step, index) => ({
      testRunId: testRun.id,
      testCaseStepId: step.id,
      sortOrder: index,
      action: step.action,
      selector: step.selector,
      selectorType: step.selectorType,
      value: step.value,
      status: 'pending' as const,
    })),
  )

  scheduleBackgroundWork(executeOwnedTestCaseRun(testRun.id))

  const testCase = await getTestCaseSummary(testCaseId)

  return {
    testCase,
    testRunId: testRun.id,
    status: 'running' as const,
  }
}

export async function getOwnedTestRunStatus(testRunId: string) {
  const testRun = (
    await db
      .select({
        id: testRuns.id,
        testCaseId: testRuns.testCaseId,
        status: testRuns.status,
        durationMs: testRuns.durationMs,
        errorMessage: testRuns.errorMessage,
        completedAt: testRuns.completedAt,
      })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1)
  ).at(0)

  if (!testRun) {
    throw new Error('Test run not found')
  }

  await requireOwnedTestCase(testRun.testCaseId)

  const steps = await db
    .select({
      testCaseStepId: testRunSteps.testCaseStepId,
      sortOrder: testRunSteps.sortOrder,
      status: testRunSteps.status,
      durationMs: testRunSteps.durationMs,
      errorMessage: testRunSteps.errorMessage,
      screenshotUrl: testRunSteps.screenshotUrl,
    })
    .from(testRunSteps)
    .where(eq(testRunSteps.testRunId, testRunId))
    .orderBy(asc(testRunSteps.sortOrder))

  const testCase = await getTestCaseSummary(testRun.testCaseId)

  return {
    testRunId: testRun.id,
    testCaseId: testRun.testCaseId,
    status: testRun.status satisfies TestRunStatus,
    durationMs: testRun.durationMs,
    errorMessage: testRun.errorMessage,
    completedAt: testRun.completedAt,
    testCase,
    steps,
  }
}

export async function runOwnedTestCase(testCaseId: string) {
  return startOwnedTestCaseRun(testCaseId)
}
