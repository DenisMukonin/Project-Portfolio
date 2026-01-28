import { eq, and, ne } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios } from '~~/server/db/schema'

// Regex: ^[a-z0-9]+(-[a-z0-9]+)*$ - matches: hello, hello-world, my-cool-site-2024
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

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

  if (body.slug !== undefined) {
    const slug = body.slug?.trim().toLowerCase()

    if (!slug) {
      throw createError({ statusCode: 400, message: 'Slug is required' })
    }

    if (slug.length < 3) {
      throw createError({ statusCode: 400, message: 'Slug must be at least 3 characters' })
    }

    if (slug.length > 50) {
      throw createError({ statusCode: 400, message: 'Slug must be 50 characters or less' })
    }

    if (!SLUG_REGEX.test(slug)) {
      throw createError({
        statusCode: 400,
        message: 'Slug can only contain lowercase letters, numbers, and hyphens'
      })
    }

    const existingSlug = await db.query.portfolios.findFirst({
      where: and(
        eq(portfolios.slug, slug),
        ne(portfolios.id, portfolioId)
      )
    })

    if (existingSlug) {
      throw createError({ statusCode: 400, message: 'This URL is already taken' })
    }
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

  const updateData: Record<string, unknown> = {
    title: body.title.trim(),
    subtitle: body.subtitle?.trim() || null,
    description: body.description?.trim() || null,
    updatedAt: new Date()
  }

  if (body.slug !== undefined) {
    updateData.slug = body.slug.trim().toLowerCase()
  }

  const [updatedPortfolio] = await db
    .update(portfolios)
    .set(updateData)
    .where(eq(portfolios.id, portfolioId))
    .returning()

  return updatedPortfolio
})
