import { and, eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  features,
  testCaseSteps,
  testCases,
  testRuns,
} from '#/db/schema.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'
import {
  getTestRunScreenshotObject,
  testRunScreenshotApiPath,
} from '#/server/integrations/r2/screenshots.ts'

export function normalizeScreenshotUrl(screenshotUrl: string | null) {
  if (!screenshotUrl) {
    return null
  }

  if (screenshotUrl.startsWith('data:') || screenshotUrl.startsWith('/api/')) {
    return screenshotUrl
  }

  const legacyKeyMatch = screenshotUrl.match(
    /^test-runs\/([^/]+)\/([^/]+)\.jpg$/,
  )
  if (legacyKeyMatch) {
    const [, testRunId, testCaseStepId] = legacyKeyMatch
    if (testRunId && testCaseStepId) {
      return testRunScreenshotApiPath(testRunId, testCaseStepId)
    }
  }

  return screenshotUrl
}

async function requireOwnedTestRunScreenshotAccess(
  testRunId: string,
  testCaseStepId: string,
) {
  const row = (
    await db
      .select({ projectId: features.projectId })
      .from(testRuns)
      .innerJoin(testCases, eq(testRuns.testCaseId, testCases.id))
      .innerJoin(features, eq(testCases.featureId, features.id))
      .innerJoin(
        testCaseSteps,
        and(
          eq(testCaseSteps.id, testCaseStepId),
          eq(testCaseSteps.testCaseId, testCases.id),
        ),
      )
      .where(eq(testRuns.id, testRunId))
      .limit(1)
  ).at(0)

  if (!row) {
    throw new Error('Screenshot not found')
  }

  await requireUserProject(row.projectId)

  return row
}

export async function readOwnedTestRunStepScreenshot(
  testRunId: string,
  testCaseStepId: string,
) {
  await requireOwnedTestRunScreenshotAccess(testRunId, testCaseStepId)

  return getTestRunScreenshotObject(testRunId, testCaseStepId)
}
