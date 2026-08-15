import { createServerFn } from '@tanstack/react-start'

import {
  getProjectLoginFlowSchema,
  listLoginFlowStepsSchema,
  replaceLoginFlowStepsSchema,
} from '#/features/login-flows/schemas/login-flow-step.ts'
import {
  getProjectLoginFlowSummary,
  listOwnedLoginFlowSteps,
  replaceOwnedLoginFlowSteps,
} from '#/features/login-flows/server/login-flows.server.ts'

export const getProjectLoginFlow = createServerFn({ method: 'GET' })
  .validator(getProjectLoginFlowSchema)
  .handler(async ({ data }) => {
    return getProjectLoginFlowSummary(data.projectId)
  })

export const listLoginFlowSteps = createServerFn({ method: 'GET' })
  .validator(listLoginFlowStepsSchema)
  .handler(async ({ data }) => {
    return listOwnedLoginFlowSteps(data.loginFlowId)
  })

export const replaceLoginFlowSteps = createServerFn({ method: 'POST' })
  .validator(replaceLoginFlowStepsSchema)
  .handler(async ({ data }) => {
    return replaceOwnedLoginFlowSteps(data)
  })
