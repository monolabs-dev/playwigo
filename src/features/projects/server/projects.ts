import { createServerFn } from '@tanstack/react-start'

import {
  createProjectSchema,
  deleteProjectSchema,
  updateProjectSchema,
} from '#/features/projects/schemas/project.ts'
import {
  insertProject,
  listUserProjects,
  removeProject,
  updateProject,
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

export const updateProjectFn = createServerFn({ method: 'POST' })
  .validator(updateProjectSchema)
  .handler(async ({ data }) => {
    return updateProject(data)
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .validator(deleteProjectSchema)
  .handler(async ({ data }) => {
    return removeProject(data.id)
  })
