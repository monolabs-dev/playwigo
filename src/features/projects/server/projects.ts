import { createServerFn } from '@tanstack/react-start'

import { createProjectSchema } from '#/features/projects/schemas/project.ts'
import {
  insertProject,
  listUserProjects,
} from '#/features/projects/server/projects.server.ts'

export const listProjects = createServerFn({ method: 'GET' }).handler(
  async () => {
    return listUserProjects()
  },
)

export const createProject = createServerFn({ method: 'POST' })
  .validator(createProjectSchema)
  .handler(async ({ data }) => {
    return insertProject(data)
  })
