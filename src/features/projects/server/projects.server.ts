import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  features,
  loginFlowSteps,
  loginFlows,
  projects,
  testAccounts,
  testCaseSteps,
  testCases,
} from '#/db/schema.ts'
import { requireSession } from '#/features/auth/server/session.server.ts'
import type { CloneProjectValues } from '#/features/projects/schemas/project.ts'
import {
  maybeReplaceUrl,
  replaceUrlInStepConfig,
  replaceUrlInStepValue,
} from '#/features/projects/utils/replace-url.ts'

const projectColumns = {
  id: projects.id,
  name: projects.name,
  website: projects.website,
} as const

export async function listUserProjects() {
  const session = await requireSession()

  return db
    .select(projectColumns)
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.createdAt))
}

export async function requireUserProject(projectId: string) {
  const session = await requireSession()

  const [project] = await db
    .select(projectColumns)
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
    )
    .limit(1)

  if (!project) {
    throw new Error('Project not found')
  }

  return project
}

export async function insertProject(input: { name: string; website: string }) {
  const session = await requireSession()

  const [project] = await db
    .insert(projects)
    .values({
      userId: session.user.id,
      name: input.name,
      website: input.website,
    })
    .returning(projectColumns)

  if (!project) {
    throw new Error('Unable to create project')
  }

  return project
}

export async function updateProject(input: {
  id: string
  name: string
  website: string
}) {
  await requireUserProject(input.id)

  const [project] = await db
    .update(projects)
    .set({
      name: input.name,
      website: input.website,
    })
    .where(eq(projects.id, input.id))
    .returning(projectColumns)

  if (!project) {
    throw new Error('Unable to update project')
  }

  return project
}

export async function removeProject(projectId: string) {
  await requireUserProject(projectId)

  const [project] = await db
    .delete(projects)
    .where(eq(projects.id, projectId))
    .returning(projectColumns)

  if (!project) {
    throw new Error('Unable to delete project')
  }

  return project
}

export async function cloneOwnedProject(input: CloneProjectValues) {
  const session = await requireSession()
  const source = await requireUserProject(input.sourceId)

  const [newProject] = await db
    .insert(projects)
    .values({
      userId: session.user.id,
      name: input.name,
      website: input.website,
    })
    .returning(projectColumns)

  if (!newProject) {
    throw new Error('Unable to clone project')
  }

  const replaceFrom = source.website
  const replaceTo = input.website
  const replaceUrls = input.replaceUrls

  try {
    const sourceAccounts = await db
      .select({
        id: testAccounts.id,
        name: testAccounts.name,
        description: testAccounts.description,
        email: testAccounts.email,
        password: testAccounts.password,
        url: testAccounts.url,
      })
      .from(testAccounts)
      .where(eq(testAccounts.projectId, source.id))

    const accountIdMap = new Map<string, string>()

    if (sourceAccounts.length > 0) {
      const insertedAccounts = await db
        .insert(testAccounts)
        .values(
          sourceAccounts.map((account) => ({
            projectId: newProject.id,
            name: account.name,
            description: account.description,
            email: account.email,
            password: account.password,
            url: maybeReplaceUrl(account.url, replaceFrom, replaceTo, replaceUrls),
          })),
        )
        .returning({ id: testAccounts.id })

      sourceAccounts.forEach((account, index) => {
        const inserted = insertedAccounts[index]
        if (inserted) {
          accountIdMap.set(account.id, inserted.id)
        }
      })
    }

    const [sourceLoginFlow] = await db
      .select({
        id: loginFlows.id,
        name: loginFlows.name,
        description: loginFlows.description,
      })
      .from(loginFlows)
      .where(eq(loginFlows.projectId, source.id))
      .limit(1)

    if (sourceLoginFlow) {
      const sourceLoginFlowSteps = await db
        .select({
          sortOrder: loginFlowSteps.sortOrder,
          action: loginFlowSteps.action,
          selector: loginFlowSteps.selector,
          selectorType: loginFlowSteps.selectorType,
          value: loginFlowSteps.value,
          config: loginFlowSteps.config,
          outputVariable: loginFlowSteps.outputVariable,
        })
        .from(loginFlowSteps)
        .where(eq(loginFlowSteps.loginFlowId, sourceLoginFlow.id))
        .orderBy(asc(loginFlowSteps.sortOrder))

      const [newLoginFlow] = await db
        .insert(loginFlows)
        .values({
          projectId: newProject.id,
          name: sourceLoginFlow.name,
          description: sourceLoginFlow.description,
        })
        .returning({ id: loginFlows.id })

      if (newLoginFlow && sourceLoginFlowSteps.length > 0) {
        await db.insert(loginFlowSteps).values(
          sourceLoginFlowSteps.map((step) => ({
            loginFlowId: newLoginFlow.id,
            sortOrder: step.sortOrder,
            action: step.action,
            selector: step.selector,
            selectorType: step.selectorType,
            value: replaceUrlInStepValue(
              step.action,
              step.value,
              replaceFrom,
              replaceTo,
              replaceUrls,
            ),
            config: replaceUrlInStepConfig(
              step.action,
              step.config,
              replaceFrom,
              replaceTo,
              replaceUrls,
            ),
            outputVariable: step.outputVariable,
          })),
        )
      }
    }

    const sourceFeatures = await db
      .select({
        id: features.id,
        name: features.name,
        description: features.description,
      })
      .from(features)
      .where(eq(features.projectId, source.id))

    const featureIdMap = new Map<string, string>()

    if (sourceFeatures.length > 0) {
      const insertedFeatures = await db
        .insert(features)
        .values(
          sourceFeatures.map((feature) => ({
            projectId: newProject.id,
            name: feature.name,
            description: feature.description,
          })),
        )
        .returning({ id: features.id })

      sourceFeatures.forEach((feature, index) => {
        const inserted = insertedFeatures[index]
        if (inserted) {
          featureIdMap.set(feature.id, inserted.id)
        }
      })
    }

    if (sourceFeatures.length > 0) {
      const sourceFeatureIds = sourceFeatures.map((feature) => feature.id)
      const sourceTestCases = await db
        .select({
          id: testCases.id,
          featureId: testCases.featureId,
          testAccountId: testCases.testAccountId,
          name: testCases.name,
          baseUrl: testCases.baseUrl,
        })
        .from(testCases)
        .where(inArray(testCases.featureId, sourceFeatureIds))

      const testCaseIdMap = new Map<string, string>()

      if (sourceTestCases.length > 0) {
        const insertedTestCases = await db
          .insert(testCases)
          .values(
            sourceTestCases.map((testCase) => {
              const newFeatureId = featureIdMap.get(testCase.featureId)
              if (!newFeatureId) {
                throw new Error('Unable to map cloned feature')
              }

              return {
                featureId: newFeatureId,
                testAccountId: testCase.testAccountId
                  ? (accountIdMap.get(testCase.testAccountId) ?? null)
                  : null,
                name: testCase.name,
                baseUrl: maybeReplaceUrl(
                  testCase.baseUrl,
                  replaceFrom,
                  replaceTo,
                  replaceUrls,
                ),
              }
            }),
          )
          .returning({ id: testCases.id })

        sourceTestCases.forEach((testCase, index) => {
          const inserted = insertedTestCases[index]
          if (inserted) {
            testCaseIdMap.set(testCase.id, inserted.id)
          }
        })

        const sourceTestCaseIds = sourceTestCases.map((testCase) => testCase.id)
        const sourceSteps = await db
          .select({
            testCaseId: testCaseSteps.testCaseId,
            sortOrder: testCaseSteps.sortOrder,
            action: testCaseSteps.action,
            selector: testCaseSteps.selector,
            selectorType: testCaseSteps.selectorType,
            value: testCaseSteps.value,
            config: testCaseSteps.config,
            outputVariable: testCaseSteps.outputVariable,
          })
          .from(testCaseSteps)
          .where(inArray(testCaseSteps.testCaseId, sourceTestCaseIds))
          .orderBy(asc(testCaseSteps.sortOrder))

        if (sourceSteps.length > 0) {
          await db.insert(testCaseSteps).values(
            sourceSteps.map((step) => {
              const newTestCaseId = testCaseIdMap.get(step.testCaseId)
              if (!newTestCaseId) {
                throw new Error('Unable to map cloned test case')
              }

              return {
                testCaseId: newTestCaseId,
                sortOrder: step.sortOrder,
                action: step.action,
                selector: step.selector,
                selectorType: step.selectorType,
                value: replaceUrlInStepValue(
                  step.action,
                  step.value,
                  replaceFrom,
                  replaceTo,
                  replaceUrls,
                ),
                config: replaceUrlInStepConfig(
                  step.action,
                  step.config,
                  replaceFrom,
                  replaceTo,
                  replaceUrls,
                ),
                outputVariable: step.outputVariable,
              }
            }),
          )
        }
      }
    }

    return newProject
  } catch (error) {
    await db.delete(projects).where(eq(projects.id, newProject.id))
    throw error
  }
}
