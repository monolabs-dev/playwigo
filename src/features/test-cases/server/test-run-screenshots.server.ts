import { and, eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  features,
  testCaseSteps,
  testCases,
  testRunSteps,
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
    const [, testRunId, stepId] = legacyKeyMatch
    if (testRunId && stepId) {
      return testRunScreenshotApiPath(testRunId, stepId)
    }
  }

  return screenshotUrl
}

async function requireOwnedTestRunScreenshotAccess(
  testRunId: string,
  stepId: string,
) {
  const byTestCaseStep = (
    await db
      .select({ projectId: features.projectId })
      .from(testRuns)
      .innerJoin(testCases, eq(testRuns.testCaseId, testCases.id))
      .innerJoin(features, eq(testCases.featureId, features.id))
      .innerJoin(
        testCaseSteps,
        and(
          eq(testCaseSteps.id, stepId),
          eq(testCaseSteps.testCaseId, testCases.id),
        ),
      )
      .where(eq(testRuns.id, testRunId))
      .limit(1)
  ).at(0)

  if (byTestCaseStep) {
    await requireUserProject(byTestCaseStep.projectId)
    return byTestCaseStep
  }

  const byRunStep = (
    await db
      .select({ projectId: features.projectId })
      .from(testRunSteps)
      .innerJoin(testRuns, eq(testRunSteps.testRunId, testRuns.id))
      .innerJoin(testCases, eq(testRuns.testCaseId, testCases.id))
      .innerJoin(features, eq(testCases.featureId, features.id))
      .where(and(eq(testRunSteps.id, stepId), eq(testRuns.id, testRunId)))
      .limit(1)
  ).at(0)

  if (!byRunStep) {
    throw new Error('Screenshot not found')
  }

  await requireUserProject(byRunStep.projectId)

  return byRunStep
}

export async function readOwnedTestRunStepScreenshot(
  testRunId: string,
  stepId: string,
) {
  await requireOwnedTestRunScreenshotAccess(testRunId, stepId)

  return getTestRunScreenshotObject(testRunId, stepId)
}
