import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  features,
  testAccounts,
  testCases,
  testRunSteps,
  testRuns,
} from '#/db/schema.ts'
import {
  executeTestCaseSteps,
} from '#/features/test-cases/server/execute-test-case-steps.ts'
import type { ExecutedStepResult } from '#/features/test-cases/server/execute-test-case-steps.ts'
import { asStepConfigJson } from '#/features/test-cases/types/step-config.ts'
import {
  maskRunVariables,
  RunVariableContext,
} from '#/features/test-cases/server/run-variables.ts'
import {
  getTestCaseSummary,
  listOwnedTestCaseStepDefinitions,
  requireOwnedTestCase,
} from '#/features/test-cases/server/test-cases.server.ts'
import type {
  TestRunStatus,
  TestRunSummary,
} from '#/features/test-cases/types/test-case.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'
import {
  resolveLoginPreludeSteps,
  resolveTestAccountVariables,
} from '#/features/login-flows/server/login-flows.server.ts'
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
  sortOrder: number,
  values: {
    status: 'running' | 'passed' | 'failed'
    durationMs?: number
    errorMessage?: string | null
    screenshotUrl?: string | null
    resolvedValue?: string | null
  },
) {
  await db
    .update(testRunSteps)
    .set(values)
    .where(
      and(
        eq(testRunSteps.testRunId, testRunId),
        eq(testRunSteps.sortOrder, sortOrder),
      ),
    )
}

async function buildRunSteps(testCaseId: string, testAccountId: string | null) {
  const owned = await requireOwnedTestCase(testCaseId)
  const [loginPrelude, testCaseStepsList] = await Promise.all([
    resolveLoginPreludeSteps({
      projectId: owned.projectId,
      testAccountId,
    }),
    listOwnedTestCaseStepDefinitions(testCaseId),
  ])

  if (testCaseStepsList.length === 0) {
    throw new Error('Add at least one step before running this test case.')
  }

  const combined = [
    ...loginPrelude.map((step) => ({
      testCaseStepId: null as string | null,
      action: step.action,
      selector: step.selector,
      selectorType: step.selectorType,
      value: step.value,
      config: step.config ?? null,
      outputVariable: step.outputVariable ?? null,
    })),
    ...testCaseStepsList.map((step) => ({
      testCaseStepId: step.id,
      action: step.action,
      selector: step.selector,
      selectorType: step.selectorType,
      value: step.value,
      config: step.config ?? null,
      outputVariable: step.outputVariable ?? null,
    })),
  ]

  return combined
}

async function finalizeOwnedTestRun(
  testRunId: string,
  values: {
    status: TestRunStatus
    durationMs: number
    errorMessage?: string | null
    resolvedVariables?: Record<string, string> | null
  },
) {
  await db
    .update(testRuns)
    .set({
      status: values.status,
      completedAt: new Date(),
      durationMs: values.durationMs,
      errorMessage: values.errorMessage ?? null,
      resolvedVariables: values.resolvedVariables ?? null,
    })
    .where(eq(testRuns.id, testRunId))
}

export async function executeOwnedTestCaseRun(testRunId: string) {
  const testRun = (
    await db
      .select({
        id: testRuns.id,
        testCaseId: testRuns.testCaseId,
        testAccountId: testRuns.testAccountId,
        startedAt: testRuns.startedAt,
        variables: testRuns.variables,
      })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1)
  ).at(0)

  if (!testRun) {
    return
  }

  const runStartedAtMs = testRun.startedAt?.getTime() ?? Date.now()

  try {
    const owned = await requireOwnedTestCase(testRun.testCaseId)

    const accountVariables = await resolveTestAccountVariables({
      projectId: owned.projectId,
      testAccountId: testRun.testAccountId,
    })

    const seed: Record<string, string> = {
      ...accountVariables,
      ...(testRun.variables ?? {}),
    }

    if (owned.baseUrl) {
      seed.baseUrl = owned.baseUrl
    }

    const variables = new RunVariableContext(seed)

    const runSteps = await db
      .select({
        id: testRunSteps.id,
        sortOrder: testRunSteps.sortOrder,
        testCaseStepId: testRunSteps.testCaseStepId,
        action: testRunSteps.action,
        selector: testRunSteps.selector,
        selectorType: testRunSteps.selectorType,
        value: testRunSteps.value,
        config: testRunSteps.config,
        outputVariable: testRunSteps.outputVariable,
      })
      .from(testRunSteps)
      .where(eq(testRunSteps.testRunId, testRunId))
      .orderBy(asc(testRunSteps.sortOrder))

    if (runSteps.length === 0) {
      await finalizeOwnedTestRun(testRunId, {
        status: 'error',
        durationMs: 0,
        errorMessage: 'Add at least one step before running this test case.',
      })
      return
    }

    const loginPreludeStepCount = runSteps.filter(
      (step) => step.testCaseStepId === null,
    ).length

    const result = await executeTestCaseSteps({
      steps: runSteps.map((step) => ({
        id: step.testCaseStepId ?? step.id,
        testCaseId: testRun.testCaseId,
        sortOrder: step.sortOrder,
        action: step.action,
        selector: step.selector,
        selectorType: step.selectorType,
        value: step.value,
        config: asStepConfigJson(step.config),
        outputVariable: step.outputVariable ?? null,
        screenshotUrl: null,
        runStatus: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      baseUrl: owned.baseUrl,
      testRunId,
      variables,
      loginPreludeStepCount,
      progress: {
        onStepStart: async (_step, index) => {
          await updateTestRunStep(testRunId, index, { status: 'running' })
        },
        onStepComplete: async (_step, index, stepResult: ExecutedStepResult) => {
          await updateTestRunStep(testRunId, index, {
            status: stepResult.status,
            durationMs: stepResult.durationMs,
            errorMessage: stepResult.errorMessage,
            screenshotUrl: stepResult.screenshotUrl,
            resolvedValue: stepResult.resolvedValue,
          })

          if (stepResult.status === 'failed') {
            await finalizeOwnedTestRun(testRunId, {
              status: 'failed',
              durationMs: Date.now() - runStartedAtMs,
              errorMessage: stepResult.errorMessage,
              resolvedVariables: variables.snapshot(),
            })
          }
        },
      },
    })

    await finalizeOwnedTestRun(testRunId, {
      status: result.status,
      durationMs: result.durationMs,
      errorMessage: result.errorMessage,
      resolvedVariables: result.resolvedVariables,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Test run failed unexpectedly'

    await finalizeOwnedTestRun(testRunId, {
      status: 'error',
      durationMs: Date.now() - runStartedAtMs,
      errorMessage: message,
    })
  }
}

export async function startOwnedTestCaseRun(
  testCaseId: string,
  variables?: Record<string, string>,
) {
  const owned = await requireOwnedTestCase(testCaseId)

  const activeRun = await findActiveTestRun(testCaseId)
  if (activeRun) {
    throw new Error('This test case is already running.')
  }

  const combinedSteps = await buildRunSteps(testCaseId, owned.testAccountId)

  const [testRun] = await db
    .insert(testRuns)
    .values({
      testCaseId,
      testAccountId: owned.testAccountId,
      status: 'running',
      queuedAt: new Date(),
      startedAt: new Date(),
      variables: variables && Object.keys(variables).length > 0 ? variables : null,
    })
    .returning({ id: testRuns.id })

  await db.insert(testRunSteps).values(
    combinedSteps.map((step, index) => ({
      testRunId: testRun.id,
      testCaseStepId: step.testCaseStepId,
      sortOrder: index,
      action: step.action,
      selector: step.selector,
      selectorType: step.selectorType,
      value: step.value,
      config: step.config ?? null,
      outputVariable: step.outputVariable ?? null,
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
        variables: testRuns.variables,
        resolvedVariables: testRuns.resolvedVariables,
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
      action: testRunSteps.action,
      selector: testRunSteps.selector,
      selectorType: testRunSteps.selectorType,
      value: testRunSteps.value,
      config: testRunSteps.config,
      outputVariable: testRunSteps.outputVariable,
      resolvedValue: testRunSteps.resolvedValue,
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
    variables: maskRunVariables(testRun.variables),
    resolvedVariables: testRun.resolvedVariables,
    testCase,
    steps: steps.map((step) => ({
      ...step,
      config: asStepConfigJson(step.config),
    })),
  }
}

export async function runOwnedTestCase(
  testCaseId: string,
  variables?: Record<string, string>,
) {
  return startOwnedTestCaseRun(testCaseId, variables)
}

export async function listProjectTestRuns(
  projectId: string,
  limit?: number,
): Promise<TestRunSummary[]> {
  await requireUserProject(projectId)

  const query = db
    .select({
      id: testRuns.id,
      status: testRuns.status,
      durationMs: testRuns.durationMs,
      errorMessage: testRuns.errorMessage,
      startedAt: testRuns.startedAt,
      completedAt: testRuns.completedAt,
      createdAt: testRuns.createdAt,
      testCaseId: testCases.id,
      testCaseName: testCases.name,
      featureId: features.id,
      featureName: features.name,
      testAccountName: testAccounts.name,
    })
    .from(testRuns)
    .innerJoin(testCases, eq(testRuns.testCaseId, testCases.id))
    .innerJoin(features, eq(testCases.featureId, features.id))
    .leftJoin(testAccounts, eq(testRuns.testAccountId, testAccounts.id))
    .where(eq(features.projectId, projectId))
    .orderBy(desc(testRuns.createdAt))

  if (limit !== undefined) {
    return query.limit(limit)
  }

  return query
}
