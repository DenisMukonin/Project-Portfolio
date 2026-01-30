import { eq, asc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, projects } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({
      statusCode: 400,
      message: 'Portfolio ID is required'
    })
  }

  const portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.id, portfolioId)
  })

  if (!portfolio) {
    throw createError({
      statusCode: 404,
      message: 'Portfolio not found'
    })
  }

  if (portfolio.userId !== session.user.id) {
    throw createError({
      statusCode: 403,
      message: 'Access denied'
    })
  }

  const projectsList = await db.query.projects.findMany({
    where: eq(projects.portfolioId, portfolioId),
    orderBy: [asc(projects.orderIndex)]
  })

  return projectsList
})
