import { desc, eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { testAccounts } from '#/db/schema.ts'
import { requireUserProject } from '#/features/projects/server/projects.server.ts'
import type {
  CreateTestAccountValues,
  UpdateTestAccountValues,
} from '#/features/test-accounts/schemas/test-account.ts'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

const testAccountColumns = {
  id: testAccounts.id,
  projectId: testAccounts.projectId,
  name: testAccounts.name,
  description: testAccounts.description,
  email: testAccounts.email,
  password: testAccounts.password,
  url: testAccounts.url,
  createdAt: testAccounts.createdAt,
  updatedAt: testAccounts.updatedAt,
} as const

const testAccountSummaryColumns = {
  id: testAccounts.id,
  projectId: testAccounts.projectId,
  name: testAccounts.name,
  description: testAccounts.description,
  email: testAccounts.email,
  url: testAccounts.url,
  createdAt: testAccounts.createdAt,
  updatedAt: testAccounts.updatedAt,
} as const

async function requireOwnedTestAccount(id: string) {
  const [account] = await db
    .select(testAccountColumns)
    .from(testAccounts)
    .where(eq(testAccounts.id, id))
    .limit(1)

  if (!account) {
    throw new Error('Test account not found')
  }

  await requireUserProject(account.projectId)

  return account
}

export async function listProjectTestAccounts(projectId: string) {
  await requireUserProject(projectId)

  return db
    .select(testAccountSummaryColumns)
    .from(testAccounts)
    .where(eq(testAccounts.projectId, projectId))
    .orderBy(desc(testAccounts.createdAt)) satisfies Promise<
    TestAccountSummary[]
  >
}

export async function insertTestAccount(input: CreateTestAccountValues) {
  await requireUserProject(input.projectId)

  const [account] = await db
    .insert(testAccounts)
    .values({
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      email: input.email,
      password: input.password,
      url: input.url,
    })
    .returning(testAccountSummaryColumns)

  if (!account) {
    throw new Error('Unable to create test account')
  }

  return account
}

export async function updateTestAccount(input: UpdateTestAccountValues) {
  await requireOwnedTestAccount(input.id)

  const [account] = await db
    .update(testAccounts)
    .set({
      name: input.name,
      description: input.description,
      email: input.email,
      url: input.url,
      ...(input.password !== null ? { password: input.password } : {}),
    })
    .where(eq(testAccounts.id, input.id))
    .returning(testAccountSummaryColumns)

  if (!account) {
    throw new Error('Unable to update test account')
  }

  return account
}

export async function removeTestAccount(id: string) {
  await requireOwnedTestAccount(id)

  const [account] = await db
    .delete(testAccounts)
    .where(eq(testAccounts.id, id))
    .returning({ id: testAccounts.id, name: testAccounts.name })

  if (!account) {
    throw new Error('Unable to delete test account')
  }

  return account
}
