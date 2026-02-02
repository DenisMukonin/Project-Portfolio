import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, projects } from '~~/server/db/schema'

// UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Max length validation constants
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 500
const MAX_URL_LENGTH = 2048

// URL validation using URL constructor for robustness
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

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

  // Read body
  const body = await readBody(event)
  const { isVisible, name, description, url } = body

  // Build update object - only include fields that were provided
  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  // Handle isVisible (existing functionality)
  if (typeof isVisible === 'boolean') {
    updateData.isVisible = isVisible
  }

  // Handle name with type guards and validation (new functionality)
  if (name !== undefined) {
    const safeName = typeof name === 'string' ? name.trim() : null

    if (safeName === null || safeName.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Project name is required'
      })
    }

    if (safeName.length > MAX_NAME_LENGTH) {
      throw createError({
        statusCode: 400,
        message: `Project name too long (max ${MAX_NAME_LENGTH} characters)`
      })
    }

    updateData.name = safeName
  }

  // Handle description with type guards and validation
  if (description !== undefined) {
    const safeDescription = typeof description === 'string' ? description.trim() : null

    if (safeDescription && safeDescription.length > MAX_DESCRIPTION_LENGTH) {
      throw createError({
        statusCode: 400,
        message: `Description too long (max ${MAX_DESCRIPTION_LENGTH} characters)`
      })
    }

    updateData.description = safeDescription || null
  }

  // Handle url with type guards and validation
  if (url !== undefined) {
    const safeUrl = typeof url === 'string' ? url.trim() : null

    if (safeUrl && safeUrl.length > 0) {
      if (safeUrl.length > MAX_URL_LENGTH) {
        throw createError({
          statusCode: 400,
          message: `URL too long (max ${MAX_URL_LENGTH} characters)`
        })
      }

      if (!isValidUrl(safeUrl)) {
        throw createError({
          statusCode: 400,
          message: 'Invalid URL format. Must be a valid http:// or https:// URL'
        })
      }

      updateData.url = safeUrl
    } else {
      // Allow clearing URL by setting to null
      updateData.url = null
    }
  }

  // Check if there's anything to update (besides updatedAt)
  if (Object.keys(updateData).length === 1) {
    throw createError({
      statusCode: 400,
      message: 'No valid fields to update'
    })
  }

  const [updated] = await db
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, projectId))
    .returning()

  return updated
})
