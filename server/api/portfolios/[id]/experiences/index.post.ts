import { eq, desc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, experiences } from '~~/server/db/schema'
import {
  UUID_REGEX,
  DATE_REGEX,
  parseAndValidateDate,
  isFutureDate,
  MAX_TITLE,
  MAX_COMPANY,
  MAX_LOCATION,
  MAX_DESCRIPTION
} from '~~/server/utils/experienceValidation'

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
  const { title, company, location, startDate, endDate, isCurrent, description } = body

  // Validate required fields with type guards
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Job title is required'
    })
  }

  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Company name is required'
    })
  }

  if (!startDate || typeof startDate !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Start date is required'
    })
  }

  // Validate date format
  if (!DATE_REGEX.test(startDate)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid start date format'
    })
  }

  // Parse and validate startDate (H1: validates actual date validity)
  const parsedStartDate = parseAndValidateDate(startDate)
  if (!parsedStartDate) {
    throw createError({
      statusCode: 400,
      message: 'Invalid start date'
    })
  }

  // M1: Reject future start dates
  if (isFutureDate(parsedStartDate)) {
    throw createError({
      statusCode: 400,
      message: 'Start date cannot be in the future'
    })
  }

  // Validate max lengths
  if (title.trim().length > MAX_TITLE) {
    throw createError({
      statusCode: 400,
      message: `Job title too long (max ${MAX_TITLE} characters)`
    })
  }

  if (company.trim().length > MAX_COMPANY) {
    throw createError({
      statusCode: 400,
      message: `Company name too long (max ${MAX_COMPANY} characters)`
    })
  }

  // Safe optional fields with type guards
  const safeLocation = typeof location === 'string' ? location.trim() : null
  if (safeLocation && safeLocation.length > MAX_LOCATION) {
    throw createError({
      statusCode: 400,
      message: `Location too long (max ${MAX_LOCATION} characters)`
    })
  }

  const safeDescription = typeof description === 'string' ? description.trim() : null
  if (safeDescription && safeDescription.length > MAX_DESCRIPTION) {
    throw createError({
      statusCode: 400,
      message: `Description too long (max ${MAX_DESCRIPTION} characters)`
    })
  }

  // Handle isCurrent flag
  const isCurrentJob = isCurrent === true

  // Validate end date if provided and not current job
  let safeEndDate: string | null = null
  if (!isCurrentJob && typeof endDate === 'string' && endDate.trim().length > 0) {
    if (!DATE_REGEX.test(endDate)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid end date format'
      })
    }

    // H1: Validate endDate is a real date
    const parsedEndDate = parseAndValidateDate(endDate)
    if (!parsedEndDate) {
      throw createError({
        statusCode: 400,
        message: 'Invalid end date'
      })
    }

    // M2: Validate endDate >= startDate
    if (parsedEndDate < parsedStartDate) {
      throw createError({
        statusCode: 400,
        message: 'End date cannot be before start date'
      })
    }

    safeEndDate = endDate.trim()
  }

  // Calculate next orderIndex
  const lastExperience = await db.query.experiences.findFirst({
    where: eq(experiences.portfolioId, portfolioId),
    orderBy: [desc(experiences.orderIndex)]
  })
  const nextOrderIndex = (lastExperience?.orderIndex ?? -1) + 1

  // Insert experience
  const [created] = await db
    .insert(experiences)
    .values({
      portfolioId,
      title: title.trim(),
      company: company.trim(),
      location: safeLocation || null,
      startDate,
      endDate: safeEndDate,
      isCurrent: isCurrentJob,
      description: safeDescription || null,
      orderIndex: nextOrderIndex
    })
    .returning()

  return created
})
