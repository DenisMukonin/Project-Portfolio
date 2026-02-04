import { eq, and, asc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, users, projects, experiences, education } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug is required' })
  }

  // Find published portfolio by slug (AC #1, #2, #3)
  const portfolio = await db.query.portfolios.findFirst({
    where: and(
      eq(portfolios.slug, slug),
      eq(portfolios.isPublished, true)
    )
  })

  // If not found or not published → throw 404 (AC #2, #3)
  if (!portfolio) {
    throw createError({ statusCode: 404, message: 'Portfolio not found' })
  }

  // Get user data (AC #4 - name, title, bio, avatarUrl, socialLinks)
  const user = await db.query.users.findFirst({
    where: eq(users.id, portfolio.userId)
  })

  // Get visible projects ordered by orderIndex (AC #4)
  const portfolioProjects = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.portfolioId, portfolio.id),
      eq(projects.isVisible, true)
    ))
    .orderBy(asc(projects.orderIndex))

  // Get experiences ordered by orderIndex (AC #4)
  const portfolioExperiences = await db
    .select()
    .from(experiences)
    .where(eq(experiences.portfolioId, portfolio.id))
    .orderBy(asc(experiences.orderIndex))

  // Get education ordered by orderIndex (AC #4)
  const portfolioEducation = await db
    .select()
    .from(education)
    .where(eq(education.portfolioId, portfolio.id))
    .orderBy(asc(education.orderIndex))

  // Return complete portfolio data object (subtask 1.8)
  return {
    portfolio: {
      id: portfolio.id,
      title: portfolio.title,
      subtitle: portfolio.subtitle,
      description: portfolio.description,
      slug: portfolio.slug,
      template: portfolio.template
    },
    user: user ? {
      name: user.name,
      title: user.title,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      socialLinks: user.socialLinks
    } : null,
    projects: portfolioProjects,
    experiences: portfolioExperiences,
    education: portfolioEducation
  }
})
