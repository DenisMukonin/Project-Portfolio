import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({ statusCode: 400, message: 'Portfolio ID is required' })
  }

  // Validate portfolio ownership
  const portfolio = await db.query.portfolios.findFirst({
    where: and(
      eq(portfolios.id, portfolioId),
      eq(portfolios.userId, session.user.id)
    )
  })

  if (!portfolio) {
    throw createError({ statusCode: 404, message: 'Portfolio not found' })
  }

  // Already published - return as-is
  if (portfolio.isPublished) {
    return portfolio
  }

  // Publish the portfolio
  const [updated] = await db
    .update(portfolios)
    .set({
      isPublished: true,
      updatedAt: new Date()
    })
    .where(eq(portfolios.id, portfolioId))
    .returning()

  return updated
})
