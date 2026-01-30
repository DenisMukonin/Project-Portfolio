import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, projects } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')
  const projectId = getRouterParam(event, 'projectId')

  if (!portfolioId || !projectId) {
    throw createError({
      statusCode: 400,
      message: 'Portfolio ID and Project ID are required'
    })
  }

  // Validate portfolio ownership
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

  // Validate project belongs to portfolio
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.portfolioId, portfolioId)
    )
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      message: 'Project not found'
    })
  }

  // Read body and update
  const body = await readBody(event)
  const { isVisible } = body

  if (typeof isVisible !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'isVisible must be a boolean'
    })
  }

  const [updated] = await db
    .update(projects)
    .set({ isVisible, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning()

  return updated
})
