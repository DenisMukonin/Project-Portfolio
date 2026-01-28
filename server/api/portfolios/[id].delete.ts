import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({ statusCode: 400, message: 'Portfolio ID is required' })
  }

  const existingPortfolio = await db.query.portfolios.findFirst({
    where: and(
      eq(portfolios.id, portfolioId),
      eq(portfolios.userId, session.user.id)
    )
  })

  if (!existingPortfolio) {
    throw createError({ statusCode: 404, message: 'Portfolio not found' })
  }

  try {
    await db.delete(portfolios).where(eq(portfolios.id, portfolioId))
    return { success: true, message: 'Portfolio deleted successfully' }
  } catch (error) {
    console.error('Portfolio deletion failed:', error)
    throw createError({ statusCode: 500, message: 'Failed to delete portfolio' })
  }
})
