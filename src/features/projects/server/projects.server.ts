import { desc, eq } from 'drizzle-orm'

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
