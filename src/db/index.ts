import { AsyncLocalStorage } from 'node:async_hooks'

import { env } from 'cloudflare:workers'
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

import * as schema from './schema.ts'

type AppDb = NeonHttpDatabase<typeof schema>

const dbStorage = new AsyncLocalStorage<AppDb>()

let localDevDb: AppDb | null = null

function getLocalDevDb() {
  if (!localDevDb) {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is required for local development when Hyperdrive is unavailable.',
      )
    }

    // HTTP driver: `pg` TCP sockets hang in Cloudflare Workers / miniflare,
    // which cancels the first auth request and makes login look like it failed.
    localDevDb = drizzleNeonHttp(databaseUrl, { schema })
  }

  return localDevDb
}

function getHyperdriveBinding() {
  if (!('HYPERDRIVE' in env) || !env.HYPERDRIVE) {
    return null
  }

  return env.HYPERDRIVE
}

export function getDb(): AppDb {
  const requestDb = dbStorage.getStore()

  if (requestDb) {
    return requestDb
  }

  return getLocalDevDb()
}

export const db = new Proxy({} as AppDb, {
  get(_target, prop) {
    const requestDb = getDb()
    const value = requestDb[prop as keyof AppDb]

    if (typeof value === 'function') {
      return value.bind(requestDb)
    }

    return value
  },
})

export async function runWithDbConnection<T>(
  fn: () => T | Promise<T>,
): Promise<T> {
  const hyperdrive = getHyperdriveBinding()

  if (!hyperdrive) {
    return fn()
  }

  const client = new Client({
    connectionString: hyperdrive.connectionString,
  })

  await client.connect()

  const requestDb = drizzleNodePostgres(client, { schema }) as unknown as AppDb

  try {
    return await dbStorage.run(requestDb, fn)
  } finally {
    await client.end()
  }
}
