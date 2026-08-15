import { desc, eq, sql } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { features, testCases, testRuns } from '#/db/schema.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'
import type { TestCaseSummary } from '#/features/test-cases/types/test-case.ts'

const testCaseColumns = {
  id: testCases.id,
  featureId: testCases.featureId,
  name: testCases.name,
  baseUrl: testCases.baseUrl,
  testAccountId: testCases.testAccountId,
  createdAt: testCases.createdAt,
  updatedAt: testCases.updatedAt,
} as const

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

export async function listFeatureTestCases(featureId: string) {
  await requireOwnedFeature(featureId)

  return db
    .select({
      ...testCaseColumns,
      latestRunStatus: sql<TestCaseSummary['latestRunStatus']>`(
        select tr.status
        from ${testRuns} tr
        where tr.test_case_id = ${testCases.id}
        order by tr.created_at desc
        limit 1
      )`,
    })
    .from(testCases)
    .where(eq(testCases.featureId, featureId))
    .orderBy(desc(testCases.createdAt)) satisfies Promise<TestCaseSummary[]>
}
