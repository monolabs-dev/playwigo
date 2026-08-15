import { and, desc, eq } from 'drizzle-orm'

import { db } from '#/db/index.ts'
import { projects } from '#/db/schema.ts'
import { requireSession } from '#/features/auth/server/session.server.ts'

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
