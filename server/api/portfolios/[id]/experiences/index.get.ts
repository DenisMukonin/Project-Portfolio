import { eq, asc, desc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, experiences } from '~~/server/db/schema'

// UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      message: 'Portfolio ID is required'
    })
  }

  if (!UUID_REGEX.test(portfolioId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid portfolio ID format'
    })
  }

  // Validate portfolio ownership
  const portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.id, portfolioId)
  })

  if (!portfolio) {
    throw createError({ statusCode: 404, message: 'Portfolio not found' })
  }

  if (portfolio.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  // Fetch experiences ordered by orderIndex (custom order), then startDate
  const result = await db.query.experiences.findMany({
    where: eq(experiences.portfolioId, portfolioId),
    orderBy: [asc(experiences.orderIndex), desc(experiences.startDate)]
  })

  return result
})
