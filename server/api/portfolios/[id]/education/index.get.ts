import { eq, asc, desc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, education } from '~~/server/db/schema'
import { UUID_REGEX } from '~~/server/utils/experienceValidation'

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

  // Fetch education ordered by orderIndex (custom order), then startDate
  const result = await db.query.education.findMany({
    where: eq(education.portfolioId, portfolioId),
    orderBy: [asc(education.orderIndex), desc(education.startDate)]
  })

  return result
})
