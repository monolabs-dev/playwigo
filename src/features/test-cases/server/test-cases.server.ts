import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  features,
  testAccounts,
  testCaseSteps,
  testCases,
  testRuns,
  testRunSteps,
} from '#/db/schema.ts'
import {
  getProjectLoginFlowSummary,
  resolveLoginPreludeSteps,
} from '#/features/login-flows/server/login-flows.server.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'
import type {
  CreateTestCaseValues,
  UpdateTestCaseValues,
} from '#/features/test-cases/schemas/test-case.ts'
import type { ReplaceTestCaseStepsValues } from '#/features/test-cases/schemas/test-case-step.ts'
import { asStepConfigJson } from '#/features/test-cases/types/step-config.ts'
import { normalizeScreenshotUrl } from '#/features/test-cases/server/test-run-screenshots.server.ts'
import { reapStaleTestRuns } from '#/features/test-cases/server/reap-stale-test-runs.ts'
import type {
  TestCaseLoginPrelude,
  TestCaseStep,
  TestCaseStepsPayload,
  TestCaseSummary,
  ProjectTestCaseSummary,
  TestRunStepStatus,
} from '#/features/test-cases/types/test-case.ts'

const testCaseColumns = {
  id: testCases.id,
  featureId: testCases.featureId,
  name: testCases.name,
  baseUrl: testCases.baseUrl,
  testAccountId: testCases.testAccountId,
  createdAt: testCases.createdAt,
  updatedAt: testCases.updatedAt,
} as const

function testCaseSummarySelect() {
  return {
    ...testCaseColumns,
    testAccountName: testAccounts.name,
    stepCount: sql<number>`(
      select count(*)::int
      from ${testCaseSteps}
      where ${testCaseSteps.testCaseId} = ${testCases.id}
    )`.mapWith(Number),
    latestRunStatus: sql<TestCaseSummary['latestRunStatus']>`(
      select tr.status
      from ${testRuns} tr
      where tr.test_case_id = ${testCases.id}
      order by tr.created_at desc
      limit 1
    )`,
    latestRunDurationMs: sql<number | null>`(
      select tr.duration_ms
      from ${testRuns} tr
      where tr.test_case_id = ${testCases.id}
      order by tr.created_at desc
      limit 1
    )`,
    latestRunAt: sql<Date | null>`(
      select coalesce(tr.completed_at, tr.created_at)
      from ${testRuns} tr
      where tr.test_case_id = ${testCases.id}
      order by tr.created_at desc
      limit 1
    )`.mapWith((value) => (value ? new Date(String(value)) : null)),
  }
}

async function requireOwnedFeature(featureId: string) {
  const feature = (
    await db
      .select({ id: features.id, projectId: features.projectId })
      .from(features)
      .where(eq(features.id, featureId))
      .limit(1)
  ).at(0)

  if (!feature) {
    throw new Error('Feature not found')
  }

  await requireUserProject(feature.projectId)

  return feature
}

export async function requireOwnedTestCase(id: string) {
  const testCase = (
    await db
      .select({
        ...testCaseColumns,
        projectId: features.projectId,
      })
      .from(testCases)
      .innerJoin(features, eq(testCases.featureId, features.id))
      .where(eq(testCases.id, id))
      .limit(1)
  ).at(0)

  if (!testCase) {
    throw new Error('Test case not found')
  }

  await requireUserProject(testCase.projectId)

  return testCase
}

async function resolveTestAccountId(
  testAccountId: string | null | undefined,
  projectId: string,
) {
  if (!testAccountId) {
    return null
  }

  const account = (
    await db
      .select({ id: testAccounts.id })
      .from(testAccounts)
      .where(
        and(
          eq(testAccounts.id, testAccountId),
          eq(testAccounts.projectId, projectId),
        ),
      )
      .limit(1)
  ).at(0)

  if (!account) {
    throw new Error('Test account not found')
  }

  return testAccountId
}

export async function getTestCaseSummary(id: string) {
  await reapStaleTestRuns()

  const testCase = (
    await db
      .select(testCaseSummarySelect())
      .from(testCases)
      .leftJoin(testAccounts, eq(testCases.testAccountId, testAccounts.id))
      .where(eq(testCases.id, id))
      .limit(1)
  ).at(0)

  if (!testCase) {
    throw new Error('Test case not found')
  }

  return testCase satisfies TestCaseSummary
}

export async function listFeatureTestCases(featureId: string) {
  await requireOwnedFeature(featureId)
  await reapStaleTestRuns()

  return db
    .select(testCaseSummarySelect())
    .from(testCases)
    .leftJoin(testAccounts, eq(testCases.testAccountId, testAccounts.id))
    .where(eq(testCases.featureId, featureId))
    .orderBy(desc(testCases.createdAt)) satisfies Promise<TestCaseSummary[]>
}

export async function listProjectTestCases(projectId: string) {
  await requireUserProject(projectId)
  await reapStaleTestRuns()

  return db
    .select({
      ...testCaseSummarySelect(),
      featureName: features.name,
    })
    .from(testCases)
    .innerJoin(features, eq(testCases.featureId, features.id))
    .leftJoin(testAccounts, eq(testCases.testAccountId, testAccounts.id))
    .where(eq(features.projectId, projectId))
    .orderBy(
      desc(features.createdAt),
      desc(testCases.createdAt),
    ) satisfies Promise<ProjectTestCaseSummary[]>
}

export async function insertTestCase(input: CreateTestCaseValues) {
  const feature = await requireOwnedFeature(input.featureId)
  const testAccountId = await resolveTestAccountId(
    input.testAccountId,
    feature.projectId,
  )

  const [testCase] = await db
    .insert(testCases)
    .values({
      featureId: input.featureId,
      name: input.name,
      baseUrl: input.baseUrl,
      testAccountId,
    })
    .returning({ id: testCases.id })

  return getTestCaseSummary(testCase.id)
}

export async function updateTestCase(input: UpdateTestCaseValues) {
  const owned = await requireOwnedTestCase(input.id)
  const testAccountId = await resolveTestAccountId(
    input.testAccountId,
    owned.projectId,
  )

  const [testCase] = await db
    .update(testCases)
    .set({
      name: input.name,
      baseUrl: input.baseUrl,
      testAccountId,
    })
    .where(eq(testCases.id, input.id))
    .returning({ id: testCases.id })

  return getTestCaseSummary(testCase.id)
}

const COPY_PREFIX = 'Copy of '

function duplicateTestCaseName(originalName: string) {
  const next = `${COPY_PREFIX}${originalName}`

  if (next.length <= 120) {
    return next
  }

  return `${COPY_PREFIX}${originalName.slice(0, 120 - COPY_PREFIX.length)}`
}

export async function duplicateOwnedTestCase(id: string) {
  const owned = await requireOwnedTestCase(id)
  const steps = await listOwnedTestCaseStepDefinitions(id)

  const [testCase] = await db
    .insert(testCases)
    .values({
      featureId: owned.featureId,
      name: duplicateTestCaseName(owned.name),
      baseUrl: owned.baseUrl,
      testAccountId: owned.testAccountId,
    })
    .returning({ id: testCases.id })

  if (steps.length > 0) {
    await db.insert(testCaseSteps).values(
      steps.map((step) => ({
        testCaseId: testCase.id,
        sortOrder: step.sortOrder,
        action: step.action,
        selector: step.selector,
        selectorType: step.selectorType,
        value: step.value,
        config: step.config ?? null,
        outputVariable: step.outputVariable ?? null,
      })),
    )
  }

  return getTestCaseSummary(testCase.id)
}

export async function removeTestCase(id: string) {
  const owned = await requireOwnedTestCase(id)

  const [testCase] = await db
    .delete(testCases)
    .where(eq(testCases.id, id))
    .returning({ id: testCases.id, name: testCases.name })

  return {
    ...testCase,
    featureId: owned.featureId,
  }
}

const testCaseStepColumns = {
  id: testCaseSteps.id,
  testCaseId: testCaseSteps.testCaseId,
  sortOrder: testCaseSteps.sortOrder,
  action: testCaseSteps.action,
  selector: testCaseSteps.selector,
  selectorType: testCaseSteps.selectorType,
  value: testCaseSteps.value,
  config: testCaseSteps.config,
  outputVariable: testCaseSteps.outputVariable,
  createdAt: testCaseSteps.createdAt,
  updatedAt: testCaseSteps.updatedAt,
} as const

export async function listOwnedTestCaseStepDefinitions(testCaseId: string) {
  await requireOwnedTestCase(testCaseId)

  const rows = await db
    .select(testCaseStepColumns)
    .from(testCaseSteps)
    .where(eq(testCaseSteps.testCaseId, testCaseId))
    .orderBy(asc(testCaseSteps.sortOrder))

  return rows.map((row) => ({
    ...row,
    config: asStepConfigJson(row.config),
  }))
}

function aggregateLoginPreludeRunStatus(
  statuses: TestRunStepStatus[],
): TestRunStepStatus | null {
  if (statuses.length === 0) {
    return null
  }

  if (statuses.some((status) => status === 'running')) {
    return 'running'
  }

  if (statuses.some((status) => status === 'cancelled')) {
    return 'cancelled'
  }

  if (statuses.some((status) => status === 'failed')) {
    return 'failed'
  }

  if (statuses.every((status) => status === 'passed')) {
    return 'passed'
  }

  if (statuses.some((status) => status === 'pending')) {
    return 'pending'
  }

  return null
}

async function buildLoginPreludeView(input: {
  projectId: string
  testAccountId: string | null
  testAccountName: string | null
  latestRunId: string | undefined
}): Promise<TestCaseLoginPrelude | null> {
  if (!input.testAccountId) {
    return null
  }

  const [preludeSteps, loginFlow] = await Promise.all([
    resolveLoginPreludeSteps({
      projectId: input.projectId,
      testAccountId: input.testAccountId,
    }),
    getProjectLoginFlowSummary(input.projectId),
  ])

  if (preludeSteps.length === 0) {
    return null
  }

  let runStatus: TestRunStepStatus | null = null
  let errorMessage: string | null = null

  if (input.latestRunId) {
    const preludeRunSteps = await db
      .select({
        status: testRunSteps.status,
        errorMessage: testRunSteps.errorMessage,
      })
      .from(testRunSteps)
      .where(
        and(
          eq(testRunSteps.testRunId, input.latestRunId),
          isNull(testRunSteps.testCaseStepId),
        ),
      )
      .orderBy(asc(testRunSteps.sortOrder))

    if (preludeRunSteps.length > 0) {
      runStatus = aggregateLoginPreludeRunStatus(
        preludeRunSteps.map((step) => step.status),
      )
      errorMessage =
        preludeRunSteps.find(
          (step) => step.status === 'failed' || step.status === 'cancelled',
        )?.errorMessage ?? null
    }
  }

  return {
    stepCount: preludeSteps.length,
    testAccountName: input.testAccountName,
    loginFlowName: loginFlow.name,
    runStatus,
    errorMessage,
  }
}

export async function listOwnedTestCaseSteps(
  testCaseId: string,
): Promise<TestCaseStepsPayload> {
  const owned = await requireOwnedTestCase(testCaseId)
  await reapStaleTestRuns()

  const testAccount = owned.testAccountId
    ? (
        await db
          .select({ name: testAccounts.name })
          .from(testAccounts)
          .where(eq(testAccounts.id, owned.testAccountId))
          .limit(1)
      ).at(0)
    : null

  const latestRun = (
    await db
      .select({ id: testRuns.id })
      .from(testRuns)
      .where(eq(testRuns.testCaseId, testCaseId))
      .orderBy(desc(testRuns.createdAt))
      .limit(1)
  ).at(0)

  const [rows, loginPrelude] = await Promise.all([
    db
      .select({
        ...testCaseStepColumns,
        screenshotUrl: testRunSteps.screenshotUrl,
        runStatus: testRunSteps.status,
        errorMessage: testRunSteps.errorMessage,
      })
      .from(testCaseSteps)
      .leftJoin(
        testRunSteps,
        and(
          eq(testRunSteps.testCaseStepId, testCaseSteps.id),
          latestRun ? eq(testRunSteps.testRunId, latestRun.id) : sql`1 = 0`,
        ),
      )
      .where(eq(testCaseSteps.testCaseId, testCaseId))
      .orderBy(asc(testCaseSteps.sortOrder)),
    buildLoginPreludeView({
      projectId: owned.projectId,
      testAccountId: owned.testAccountId,
      testAccountName: testAccount?.name ?? null,
      latestRunId: latestRun?.id,
    }),
  ])

  const steps = rows.map((row) => ({
    id: row.id,
    testCaseId: row.testCaseId,
    sortOrder: row.sortOrder,
    action: row.action,
    selector: row.selector,
    selectorType: row.selectorType,
    value: row.value,
    config: asStepConfigJson(row.config),
    outputVariable: row.outputVariable ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    screenshotUrl: normalizeScreenshotUrl(row.screenshotUrl ?? null),
    runStatus: row.runStatus ?? null,
    errorMessage: row.errorMessage ?? null,
  })) satisfies TestCaseStep[]

  return { steps, loginPrelude }
}

export async function replaceOwnedTestCaseSteps(
  input: ReplaceTestCaseStepsValues,
) {
  await requireOwnedTestCase(input.testCaseId)

  const existing = await db
    .select({ id: testCaseSteps.id })
    .from(testCaseSteps)
    .where(eq(testCaseSteps.testCaseId, input.testCaseId))

  const existingIds = new Set(existing.map((step) => step.id))

  for (const step of input.steps) {
    if (step.id && !existingIds.has(step.id)) {
      throw new Error('Step not found')
    }
  }

  const incomingIds = new Set(
    input.steps.flatMap((step) => (step.id ? [step.id] : [])),
  )
  const removedIds = existing
    .map((step) => step.id)
    .filter((id) => !incomingIds.has(id))

  if (removedIds.length > 0) {
    await db.delete(testCaseSteps).where(inArray(testCaseSteps.id, removedIds))
  }

  const kept = input.steps.filter((step) => step.id && existingIds.has(step.id))

  for (const [index, step] of kept.entries()) {
    await db
      .update(testCaseSteps)
      .set({ sortOrder: -(index + 1) })
      .where(eq(testCaseSteps.id, step.id!))
  }

  for (const [index, step] of input.steps.entries()) {
    const selector = step.selector ?? null
    const value = step.value ?? null
    const selectorType = selector ? (step.selectorType ?? 'css') : null
    const outputVariable = step.outputVariable ?? null
    const config = step.config ?? null

    if (step.id && existingIds.has(step.id)) {
      await db
        .update(testCaseSteps)
        .set({
          action: step.action,
          selector,
          selectorType,
          value,
          config,
          outputVariable,
          sortOrder: index,
        })
        .where(
          and(
            eq(testCaseSteps.id, step.id),
            eq(testCaseSteps.testCaseId, input.testCaseId),
          ),
        )
    } else {
      await db.insert(testCaseSteps).values({
        testCaseId: input.testCaseId,
        action: step.action,
        selector,
        selectorType,
        value,
        config,
        outputVariable,
        sortOrder: index,
      })
    }
  }

  const [payload, testCase] = await Promise.all([
    listOwnedTestCaseSteps(input.testCaseId),
    getTestCaseSummary(input.testCaseId),
  ])

  return { steps: payload.steps, testCase }
}
