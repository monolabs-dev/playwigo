import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '#/db'
import * as schema from '#/db/schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  experimental: { joins: true },
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  plugins: [tanstackStartCookies()],
})
