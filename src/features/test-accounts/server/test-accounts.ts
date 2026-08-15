import { createServerFn } from '@tanstack/react-start'

import {
  createTestAccountSchema,
  deleteTestAccountSchema,
  listTestAccountsSchema,
  updateTestAccountSchema,
} from '#/features/test-accounts/schemas/test-account.ts'
import {
  insertTestAccount,
  listProjectTestAccounts,
  removeTestAccount,
  updateTestAccount,
} from '#/features/test-accounts/server/test-accounts.server.ts'

export const listTestAccounts = createServerFn({ method: 'GET' })
  .validator(listTestAccountsSchema)
  .handler(async ({ data }) => {
    return listProjectTestAccounts(data.projectId)
  })

export const createTestAccount = createServerFn({ method: 'POST' })
  .validator(createTestAccountSchema)
  .handler(async ({ data }) => {
    return insertTestAccount(data)
  })

export const updateTestAccountFn = createServerFn({ method: 'POST' })
  .validator(updateTestAccountSchema)
  .handler(async ({ data }) => {
    return updateTestAccount(data)
  })

export const deleteTestAccount = createServerFn({ method: 'POST' })
  .validator(deleteTestAccountSchema)
  .handler(async ({ data }) => {
    return removeTestAccount(data.id)
  })
