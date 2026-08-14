import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema.ts'

// HTTP driver: `pg` TCP sockets hang in Cloudflare Workers / miniflare,
// which cancels the first auth request and makes login look like it failed.
export const db = drizzle(process.env.DATABASE_URL!, { schema })
