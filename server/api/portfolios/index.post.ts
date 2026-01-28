import { eq, count } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, users } from '~~/server/db/schema'

const MAX_SLUG_RETRIES = 5

function sanitizeSlug(username: string | null): string {
  const sanitized = (username || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // M4 Fix: Fallback to 'portfolio' if username produces empty slug
  return sanitized || 'portfolio'
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const message = 'message' in error ? String(error.message) : ''
  const code = 'code' in error ? String(error.code) : ''
  return code === '23505' || message.includes('unique') || message.includes('duplicate')
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id)
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  const baseSlug = sanitizeSlug(user.username)

  // M2 Fix: Retry loop to handle race conditions on slug uniqueness
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    try {
      const countResult = await db
        .select({ value: count() })
        .from(portfolios)
        .where(eq(portfolios.userId, session.user.id))

      const existingCount = (countResult[0]?.value ?? 0) + attempt
      const slug = existingCount > 0 ? `${baseSlug}-${existingCount + 1}` : baseSlug

      const [newPortfolio] = await db.insert(portfolios).values({
        userId: session.user.id,
        slug,
        title: 'My Portfolio',
        template: 'minimal'
      }).returning()

      setResponseStatus(event, 201)
      return newPortfolio
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      if (isUniqueConstraintError(error) && attempt < MAX_SLUG_RETRIES - 1) {
        continue
      }

      console.error('Failed to create portfolio:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to create portfolio'
      })
    }
  }

  throw createError({
    statusCode: 500,
    message: 'Failed to generate unique slug after multiple attempts'
  })
})
