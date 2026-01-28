import { defineConfig } from 'drizzle-kit'

// Support both NUXT_DATABASE_URL (Nuxt convention) and DATABASE_URL (standard)
const databaseUrl = process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    'Database URL not found. Set NUXT_DATABASE_URL or DATABASE_URL environment variable.\n'
    + 'Example: NUXT_DATABASE_URL=postgresql://user:password@localhost:5432/portfolio'
  )
}

export default defineConfig({
  schema: './server/db/schema',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl
  }
})
