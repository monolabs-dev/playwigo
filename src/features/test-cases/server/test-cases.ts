import { createServerFn } from '@tanstack/react-start'

import {
  createTestCaseSchema,
  deleteTestCaseSchema,
  listFeatureTestCasesSchema,
  updateTestCaseSchema,
} from '#/features/test-cases/schemas/test-case.ts'
import {
  listTestCaseStepsSchema,
  replaceTestCaseStepsSchema,
} from '#/features/test-cases/schemas/test-case-step.ts'
import {
  insertTestCase,
  listFeatureTestCases,
  listOwnedTestCaseSteps,
  removeTestCase,
  replaceOwnedTestCaseSteps,
  updateTestCase,
} from '#/features/test-cases/server/test-cases.server.ts'

export const listTestCases = createServerFn({ method: 'GET' })
  .validator(listFeatureTestCasesSchema)
  .handler(async ({ data }) => {
    return listFeatureTestCases(data.featureId)
  })

export const createTestCase = createServerFn({ method: 'POST' })
  .validator(createTestCaseSchema)
  .handler(async ({ data }) => {
    return insertTestCase(data)
  })

export const updateTestCaseFn = createServerFn({ method: 'POST' })
  .validator(updateTestCaseSchema)
  .handler(async ({ data }) => {
    return updateTestCase(data)
  })

export const deleteTestCase = createServerFn({ method: 'POST' })
  .validator(deleteTestCaseSchema)
  .handler(async ({ data }) => {
    return removeTestCase(data.id)
  })

export const listTestCaseSteps = createServerFn({ method: 'GET' })
  .validator(listTestCaseStepsSchema)
  .handler(async ({ data }) => {
    return listOwnedTestCaseSteps(data.testCaseId)
  })

export const replaceTestCaseSteps = createServerFn({ method: 'POST' })
  .validator(replaceTestCaseStepsSchema)
  .handler(async ({ data }) => {
    return replaceOwnedTestCaseSteps(data)
  })
