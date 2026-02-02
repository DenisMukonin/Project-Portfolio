import { eq, desc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, projects } from '~~/server/db/schema'

// UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  // Read and validate body
  const body = await readBody(event)
  const { name, description, url, language } = body

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Project name is required'
    })
  }

  // Validate and sanitize optional string fields (H1 fix: type guards)
  const safeDescription = typeof description === 'string' ? description.trim() : null
  const safeUrl = typeof url === 'string' ? url.trim() : null
  const safeLanguage = typeof language === 'string' ? language.trim() : null

  // Validate URL format if provided (M2 fix: use URL constructor)
  if (safeUrl && safeUrl.length > 0) {
    if (!isValidUrl(safeUrl)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid URL format. Must be a valid http:// or https:// URL'
      })
    }
  }

  // Validate maximum lengths (M1 fix: prevent oversized inputs)
  const MAX_NAME_LENGTH = 100
  const MAX_DESCRIPTION_LENGTH = 500
  const MAX_URL_LENGTH = 2048
  const MAX_LANGUAGE_LENGTH = 50

  if (name.trim().length > MAX_NAME_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Project name too long (max ${MAX_NAME_LENGTH} characters)`
    })
  }

  if (safeDescription && safeDescription.length > MAX_DESCRIPTION_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Description too long (max ${MAX_DESCRIPTION_LENGTH} characters)`
    })
  }

  if (safeUrl && safeUrl.length > MAX_URL_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `URL too long (max ${MAX_URL_LENGTH} characters)`
    })
  }

  if (safeLanguage && safeLanguage.length > MAX_LANGUAGE_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Language too long (max ${MAX_LANGUAGE_LENGTH} characters)`
    })
  }

  // Calculate next orderIndex
  const lastProject = await db.query.projects.findFirst({
    where: eq(projects.portfolioId, portfolioId),
    orderBy: [desc(projects.orderIndex)]
  })
  const nextOrderIndex = (lastProject?.orderIndex ?? -1) + 1

  // Insert project (githubRepoId is null for manual projects)
  const [created] = await db
    .insert(projects)
    .values({
      portfolioId,
      name: name.trim(),
      description: safeDescription || null,
      url: safeUrl || null,
      language: safeLanguage || null,
      githubRepoId: null, // Manual project marker
      stars: 0,
      isVisible: true,
      orderIndex: nextOrderIndex
    })
    .returning()

  return created
})
