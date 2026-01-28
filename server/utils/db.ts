import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

const config = useRuntimeConfig()

if (!config.databaseUrl) {
  throw new Error(
    'NUXT_DATABASE_URL environment variable is not set. '
    + 'Add it to your .env file (see .env.example)'
  )
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(config.databaseUrl, { prepare: false })
export const db = drizzle(client, { schema })
