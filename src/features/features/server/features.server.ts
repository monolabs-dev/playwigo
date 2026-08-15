import { count, desc, eq, sql } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { features, testCases, testRuns } from '#/db/schema.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'
import type {
  CreateFeatureValues,
  UpdateFeatureValues,
} from '#/features/features/schemas/feature.ts'
import type { FeatureSummary } from '#/features/features/types/feature.ts'

const featureColumns = {
  id: features.id,
  projectId: features.projectId,
  name: features.name,
  description: features.description,
  createdAt: features.createdAt,
  updatedAt: features.updatedAt,
} as const

async function requireOwnedFeature(id: string) {
  const [feature] = await db
    .select(featureColumns)
    .from(features)
    .where(eq(features.id, id))
    .limit(1)

  if (!feature) {
    throw new Error('Feature not found')
  }

  await requireUserProject(feature.projectId)

  return feature
}

export async function listProjectFeatures(projectId: string) {
  await requireUserProject(projectId)

  return db
    .select({
      ...featureColumns,
      testCaseCount: sql<number>`(
        select count(*)::int
        from ${testCases}
        where ${testCases.featureId} = ${features.id}
      )`.mapWith(Number),
      passingTestCaseCount: sql<number>`(
        select count(*)::int
        from ${testCases} tc
        where tc.feature_id = ${features.id}
        and (
          select tr.status
          from ${testRuns} tr
          where tr.test_case_id = tc.id
          order by tr.created_at desc
          limit 1
        ) = 'passed'
      )`.mapWith(Number),
    })
    .from(features)
    .where(eq(features.projectId, projectId))
    .orderBy(desc(features.createdAt)) satisfies Promise<FeatureSummary[]>
}

export async function getProjectFeature(featureId: string) {
  const [feature] = await db
    .select({
      ...featureColumns,
      testCaseCount: sql<number>`(
        select count(*)::int
        from ${testCases}
        where ${testCases.featureId} = ${features.id}
      )`.mapWith(Number),
      passingTestCaseCount: sql<number>`(
        select count(*)::int
        from ${testCases} tc
        where tc.feature_id = ${features.id}
        and (
          select tr.status
          from ${testRuns} tr
          where tr.test_case_id = tc.id
          order by tr.created_at desc
          limit 1
        ) = 'passed'
      )`.mapWith(Number),
    })
    .from(features)
    .where(eq(features.id, featureId))
    .limit(1)

  if (!feature) {
    throw new Error('Feature not found')
  }

  await requireUserProject(feature.projectId)

  return feature satisfies FeatureSummary
}

export async function countProjectFeatures(projectId: string) {
  await requireUserProject(projectId)

  const [result] = await db
    .select({ count: count() })
    .from(features)
    .where(eq(features.projectId, projectId))

  return result?.count ?? 0
}

export async function insertFeature(input: CreateFeatureValues) {
  await requireUserProject(input.projectId)

  const [feature] = await db
    .insert(features)
    .values({
      projectId: input.projectId,
      name: input.name,
      description: input.description,
    })
    .returning(featureColumns)

  if (!feature) {
    throw new Error('Unable to create feature')
  }

  return {
    ...feature,
    testCaseCount: 0,
    passingTestCaseCount: 0,
  } satisfies FeatureSummary
}

export async function updateFeature(input: UpdateFeatureValues) {
  await requireOwnedFeature(input.id)

  const [feature] = await db
    .update(features)
    .set({
      name: input.name,
      description: input.description,
    })
    .where(eq(features.id, input.id))
    .returning(featureColumns)

  if (!feature) {
    throw new Error('Unable to update feature')
  }

  const [counts] = await db
    .select({
      testCaseCount: count(),
      passingTestCaseCount: sql<number>`(
        select count(*)::int
        from ${testCases} tc
        where tc.feature_id = ${feature.id}
        and (
          select tr.status
          from ${testRuns} tr
          where tr.test_case_id = tc.id
          order by tr.created_at desc
          limit 1
        ) = 'passed'
      )`.mapWith(Number),
    })
    .from(testCases)
    .where(eq(testCases.featureId, feature.id))

  return {
    ...feature,
    testCaseCount: counts?.testCaseCount ?? 0,
    passingTestCaseCount: counts?.passingTestCaseCount ?? 0,
  } satisfies FeatureSummary
}

export async function removeFeature(id: string) {
  const owned = await requireOwnedFeature(id)

  const [feature] = await db
    .delete(features)
    .where(eq(features.id, id))
    .returning({ id: features.id, name: features.name })

  if (!feature) {
    throw new Error('Unable to delete feature')
  }

  return {
    ...feature,
    projectId: owned.projectId,
  }
}
