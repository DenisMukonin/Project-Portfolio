import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, experiences } from '~~/server/db/schema'
import { UUID_REGEX } from '~~/server/utils/experienceValidation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')
  const experienceId = getRouterParam(event, 'experienceId')

  // Validate required IDs
  if (!portfolioId || !experienceId) {
    throw createError({
      statusCode: 400,
      message: 'Portfolio ID and Experience ID are required'
    })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(portfolioId) || !UUID_REGEX.test(experienceId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid ID format'
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

  // Validate experience belongs to portfolio
  const experience = await db.query.experiences.findFirst({
    where: and(
      eq(experiences.id, experienceId),
      eq(experiences.portfolioId, portfolioId)
    )
  })

  if (!experience) {
    throw createError({ statusCode: 404, message: 'Experience not found' })
  }

  // Delete experience
  await db.delete(experiences).where(eq(experiences.id, experienceId))

  return { success: true, message: 'Experience deleted successfully' }
})
