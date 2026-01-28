import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({ statusCode: 400, message: 'Portfolio ID is required' })
  }

  const body = await readBody(event)

  if (!body.title || body.title.trim() === '') {
    throw createError({ statusCode: 400, message: 'Title is required' })
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

  const [updatedPortfolio] = await db
    .update(portfolios)
    .set({
      title: body.title.trim(),
      subtitle: body.subtitle?.trim() || null,
      description: body.description?.trim() || null,
      updatedAt: new Date()
    })
    .where(eq(portfolios.id, portfolioId))
    .returning()

  return updatedPortfolio
})
