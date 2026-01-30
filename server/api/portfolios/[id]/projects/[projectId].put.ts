import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, projects } from '~~/server/db/schema'

// UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  // Validate UUID format to prevent database errors
  if (!UUID_REGEX.test(portfolioId) || !UUID_REGEX.test(projectId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid ID format'
    })
  }

  // Validate portfolio ownership
  // NOTE: Could be optimized with JOIN query in future iteration
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
