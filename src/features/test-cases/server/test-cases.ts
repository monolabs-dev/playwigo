import { createServerFn } from '@tanstack/react-start'

import {
  createTestCaseSchema,
  deleteTestCaseSchema,
  duplicateTestCaseSchema,
  listFeatureTestCasesSchema,
  listProjectTestCasesSchema,
  updateTestCaseSchema,
} from '#/features/test-cases/schemas/test-case.ts'
import {
  listTestCaseStepsSchema,
  replaceTestCaseStepsSchema,
} from '#/features/test-cases/schemas/test-case-step.ts'
import {
  cancelTestCaseRunSchema,
  cancelTestRunSchema,
  getTestRunStatusSchema,
  listProjectTestRunsSchema,
  runTestCaseSchema,
} from '#/features/test-cases/schemas/test-run.ts'
import {
  duplicateOwnedTestCase,
  insertTestCase,
  listFeatureTestCases,
  listProjectTestCases,
  listOwnedTestCaseSteps,
  removeTestCase,
  replaceOwnedTestCaseSteps,
  updateTestCase,
} from '#/features/test-cases/server/test-cases.server.ts'
import {
  cancelOwnedTestCaseRun,
  cancelOwnedTestRun,
  getOwnedTestRunStatus,
  listProjectTestRuns,
  runOwnedTestCase,
} from '#/features/test-cases/server/test-runs.server.ts'

export const listTestCases = createServerFn({ method: 'GET' })
  .validator(listFeatureTestCasesSchema)
  .handler(async ({ data }) => {
    return listFeatureTestCases(data.featureId)
  })

export const listProjectTestCasesFn = createServerFn({ method: 'GET' })
  .validator(listProjectTestCasesSchema)
  .handler(async ({ data }) => {
    return listProjectTestCases(data.projectId)
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

export const duplicateTestCase = createServerFn({ method: 'POST' })
  .validator(duplicateTestCaseSchema)
  .handler(async ({ data }) => {
    return duplicateOwnedTestCase(data.id)
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

export const runTestCase = createServerFn({ method: 'POST' })
  .validator(runTestCaseSchema)
  .handler(async ({ data }) => {
    return runOwnedTestCase(data.testCaseId, data.variables)
  })

export const getTestRunStatus = createServerFn({ method: 'GET' })
  .validator(getTestRunStatusSchema)
  .handler(async ({ data }) => {
    return getOwnedTestRunStatus(data.testRunId)
  })

export const cancelTestRun = createServerFn({ method: 'POST' })
  .validator(cancelTestRunSchema)
  .handler(async ({ data }) => {
    return cancelOwnedTestRun(data.testRunId)
  })

export const cancelTestCaseRun = createServerFn({ method: 'POST' })
  .validator(cancelTestCaseRunSchema)
  .handler(async ({ data }) => {
    return cancelOwnedTestCaseRun(data.testCaseId)
  })

export const listTestRuns = createServerFn({ method: 'GET' })
  .validator(listProjectTestRunsSchema)
  .handler(async ({ data }) => {
    return listProjectTestRuns(data.projectId, data.limit)
  })
