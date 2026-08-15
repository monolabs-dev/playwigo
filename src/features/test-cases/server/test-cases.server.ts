import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  features,
  testAccounts,
  testCaseSteps,
  testCases,
  testRuns,
  testRunSteps,
} from '#/db/schema.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'
import type {
  CreateTestCaseValues,
  UpdateTestCaseValues,
} from '#/features/test-cases/schemas/test-case.ts'
import type { ReplaceTestCaseStepsValues } from '#/features/test-cases/schemas/test-case-step.ts'
import type {
  TestCaseStep,
  TestCaseSummary,
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
    )`,
  }
}

async function requireOwnedFeature(featureId: string) {
  const [feature] = await db
    .select({ id: features.id, projectId: features.projectId })
    .from(features)
    .where(eq(features.id, featureId))
    .limit(1)

  if (!feature) {
    throw new Error('Feature not found')
  }

  await requireUserProject(feature.projectId)

  return feature
}

async function requireOwnedTestCase(id: string) {
  const [testCase] = await db
    .select({
      ...testCaseColumns,
      projectId: features.projectId,
    })
    .from(testCases)
    .innerJoin(features, eq(testCases.featureId, features.id))
    .where(eq(testCases.id, id))
    .limit(1)

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

  const [account] = await db
    .select({ id: testAccounts.id })
    .from(testAccounts)
    .where(
      and(
        eq(testAccounts.id, testAccountId),
        eq(testAccounts.projectId, projectId),
      ),
    )
    .limit(1)

  if (!account) {
    throw new Error('Test account not found')
  }

  return testAccountId
}

async function getTestCaseSummary(id: string) {
  const [testCase] = await db
    .select(testCaseSummarySelect())
    .from(testCases)
    .leftJoin(testAccounts, eq(testCases.testAccountId, testAccounts.id))
    .where(eq(testCases.id, id))
    .limit(1)

  if (!testCase) {
    throw new Error('Test case not found')
  }

  return testCase satisfies TestCaseSummary
}

export async function listFeatureTestCases(featureId: string) {
  await requireOwnedFeature(featureId)

  return db
    .select(testCaseSummarySelect())
    .from(testCases)
    .leftJoin(testAccounts, eq(testCases.testAccountId, testAccounts.id))
    .where(eq(testCases.featureId, featureId))
    .orderBy(desc(testCases.createdAt)) satisfies Promise<TestCaseSummary[]>
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

  if (!testCase) {
    throw new Error('Unable to create test case')
  }

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

  if (!testCase) {
    throw new Error('Unable to update test case')
  }

  return getTestCaseSummary(testCase.id)
}

export async function removeTestCase(id: string) {
  const owned = await requireOwnedTestCase(id)

  const [testCase] = await db
    .delete(testCases)
    .where(eq(testCases.id, id))
    .returning({ id: testCases.id, name: testCases.name })

  if (!testCase) {
    throw new Error('Unable to delete test case')
  }

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
  createdAt: testCaseSteps.createdAt,
  updatedAt: testCaseSteps.updatedAt,
} as const

export async function listOwnedTestCaseSteps(testCaseId: string) {
  await requireOwnedTestCase(testCaseId)

  return db
    .select({
      ...testCaseStepColumns,
      screenshotUrl: sql<string | null>`(
        select ${testRunSteps.screenshotUrl}
        from ${testRunSteps}
        where ${testRunSteps.testCaseStepId} = ${testCaseSteps.id}
          and ${testRunSteps.screenshotUrl} is not null
        order by ${testRunSteps.createdAt} desc
        limit 1
      )`,
    })
    .from(testCaseSteps)
    .where(eq(testCaseSteps.testCaseId, testCaseId))
    .orderBy(asc(testCaseSteps.sortOrder)) satisfies Promise<TestCaseStep[]>
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

    if (step.id && existingIds.has(step.id)) {
      await db
        .update(testCaseSteps)
        .set({
          action: step.action,
          selector,
          selectorType,
          value,
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
        sortOrder: index,
      })
    }
  }

  const [steps, testCase] = await Promise.all([
    listOwnedTestCaseSteps(input.testCaseId),
    getTestCaseSummary(input.testCaseId),
  ])

  return { steps, testCase }
}
