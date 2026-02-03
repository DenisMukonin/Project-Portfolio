import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, education } from '~~/server/db/schema'
import { UUID_REGEX } from '~~/server/utils/experienceValidation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')
  const educationId = getRouterParam(event, 'educationId')

  // Validate required IDs
  if (!portfolioId || !educationId) {
    throw createError({
      statusCode: 400,
      message: 'Portfolio ID and Education ID are required'
    })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(portfolioId) || !UUID_REGEX.test(educationId)) {
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

  // Validate education belongs to portfolio
  const educationRecord = await db.query.education.findFirst({
    where: and(
      eq(education.id, educationId),
      eq(education.portfolioId, portfolioId)
    )
  })

  if (!educationRecord) {
    throw createError({ statusCode: 404, message: 'Education not found' })
  }

  // Delete education
  await db.delete(education).where(eq(education.id, educationId))

  return { success: true, message: 'Education deleted successfully' }
})
