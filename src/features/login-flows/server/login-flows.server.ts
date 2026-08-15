import { and, asc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import {
  loginFlowSteps,
  loginFlows,
  projects,
  testAccounts,
} from '#/db/schema.ts'
import type { ReplaceLoginFlowStepsValues } from '#/features/login-flows/schemas/login-flow-step.ts'
import type {
  LoginFlowStep,
  LoginFlowSummary,
} from '#/features/login-flows/types/login-flow.ts'
import {
  substituteLoginFlowStep,
  type LoginFlowVariableValues,
} from '#/features/login-flows/utils/login-flow-variables.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'

const loginFlowColumns = {
  id: loginFlows.id,
  projectId: loginFlows.projectId,
  name: loginFlows.name,
  description: loginFlows.description,
  createdAt: loginFlows.createdAt,
  updatedAt: loginFlows.updatedAt,
} as const

const loginFlowStepColumns = {
  id: loginFlowSteps.id,
  loginFlowId: loginFlowSteps.loginFlowId,
  sortOrder: loginFlowSteps.sortOrder,
  action: loginFlowSteps.action,
  selector: loginFlowSteps.selector,
  selectorType: loginFlowSteps.selectorType,
  value: loginFlowSteps.value,
  createdAt: loginFlowSteps.createdAt,
  updatedAt: loginFlowSteps.updatedAt,
} as const

function loginFlowSummarySelect() {
  return {
    ...loginFlowColumns,
    stepCount: sql<number>`(
      select count(*)::int
      from ${loginFlowSteps}
      where ${loginFlowSteps.loginFlowId} = ${loginFlows.id}
    )`.mapWith(Number),
  }
}

async function requireOwnedLoginFlow(loginFlowId: string) {
  const loginFlow = (
    await db
      .select(loginFlowColumns)
      .from(loginFlows)
      .where(eq(loginFlows.id, loginFlowId))
      .limit(1)
  ).at(0)

  if (!loginFlow) {
    throw new Error('Login flow not found')
  }

  await requireUserProject(loginFlow.projectId)

  return loginFlow
}

export async function getProjectLoginFlowSummary(projectId: string) {
  await requireUserProject(projectId)

  const existing = (
    await db
      .select(loginFlowSummarySelect())
      .from(loginFlows)
      .where(eq(loginFlows.projectId, projectId))
      .limit(1)
  ).at(0)

  if (existing) {
    return existing satisfies LoginFlowSummary
  }

  const [created] = await db
    .insert(loginFlows)
    .values({
      projectId,
      name: 'Default login',
    })
    .returning(loginFlowSummarySelect())

  if (!created) {
    throw new Error('Unable to create login flow')
  }

  return created satisfies LoginFlowSummary
}

export async function listOwnedLoginFlowSteps(loginFlowId: string) {
  await requireOwnedLoginFlow(loginFlowId)

  return db
    .select(loginFlowStepColumns)
    .from(loginFlowSteps)
    .where(eq(loginFlowSteps.loginFlowId, loginFlowId))
    .orderBy(asc(loginFlowSteps.sortOrder)) satisfies Promise<LoginFlowStep[]>
}

export async function replaceOwnedLoginFlowSteps(
  input: ReplaceLoginFlowStepsValues,
) {
  await requireOwnedLoginFlow(input.loginFlowId)

  const existing = await db
    .select({ id: loginFlowSteps.id })
    .from(loginFlowSteps)
    .where(eq(loginFlowSteps.loginFlowId, input.loginFlowId))

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
    await db
      .delete(loginFlowSteps)
      .where(inArray(loginFlowSteps.id, removedIds))
  }

  const kept = input.steps.filter((step) => step.id && existingIds.has(step.id))

  for (const [index, step] of kept.entries()) {
    await db
      .update(loginFlowSteps)
      .set({ sortOrder: -(index + 1) })
      .where(eq(loginFlowSteps.id, step.id!))
  }

  for (const [index, step] of input.steps.entries()) {
    const selector = step.selector ?? null
    const value = step.value ?? null
    const selectorType = selector ? (step.selectorType ?? 'css') : null

    if (step.id && existingIds.has(step.id)) {
      await db
        .update(loginFlowSteps)
        .set({
          action: step.action,
          selector,
          selectorType,
          value,
          sortOrder: index,
        })
        .where(
          and(
            eq(loginFlowSteps.id, step.id),
            eq(loginFlowSteps.loginFlowId, input.loginFlowId),
          ),
        )
    } else {
      await db.insert(loginFlowSteps).values({
        loginFlowId: input.loginFlowId,
        action: step.action,
        selector,
        selectorType,
        value,
        sortOrder: index,
      })
    }
  }

  const [steps, loginFlow] = await Promise.all([
    listOwnedLoginFlowSteps(input.loginFlowId),
    db
      .select(loginFlowSummarySelect())
      .from(loginFlows)
      .where(eq(loginFlows.id, input.loginFlowId))
      .limit(1)
      .then((rows) => rows.at(0)),
  ])

  if (!loginFlow) {
    throw new Error('Login flow not found')
  }

  return { steps, loginFlow }
}

export type ResolvedLoginPreludeStep = {
  id: string
  sortOrder: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
}

export async function resolveLoginPreludeSteps(input: {
  projectId: string
  testAccountId: string | null
}) {
  if (!input.testAccountId) {
    return [] satisfies ResolvedLoginPreludeStep[]
  }

  const [account, project, loginFlow] = await Promise.all([
    db
      .select({
        email: testAccounts.email,
        password: testAccounts.password,
        url: testAccounts.url,
      })
      .from(testAccounts)
      .where(
        and(
          eq(testAccounts.id, input.testAccountId),
          eq(testAccounts.projectId, input.projectId),
        ),
      )
      .limit(1)
      .then((rows) => rows.at(0)),
    db
      .select({ website: projects.website })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1)
      .then((rows) => rows.at(0)),
    db
      .select({ id: loginFlows.id })
      .from(loginFlows)
      .where(eq(loginFlows.projectId, input.projectId))
      .limit(1)
      .then((rows) => rows.at(0)),
  ])

  if (!account || !loginFlow) {
    return [] satisfies ResolvedLoginPreludeStep[]
  }

  const steps = await db
    .select(loginFlowStepColumns)
    .from(loginFlowSteps)
    .where(eq(loginFlowSteps.loginFlowId, loginFlow.id))
    .orderBy(asc(loginFlowSteps.sortOrder))

  if (steps.length === 0) {
    return [] satisfies ResolvedLoginPreludeStep[]
  }

  const variables = {
    email: account.email ?? '',
    password: account.password ?? '',
    loginUrl: account.url ?? project?.website ?? '',
  } satisfies LoginFlowVariableValues

  return steps.map((step, index) => {
    const resolved = substituteLoginFlowStep(step, variables)

    return {
      id: step.id,
      sortOrder: index,
      action: resolved.action,
      selector: resolved.selector,
      selectorType: resolved.selectorType,
      value: resolved.value,
    }
  }) satisfies ResolvedLoginPreludeStep[]
}
