import { eq, desc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, education } from '~~/server/db/schema'
import {
  UUID_REGEX,
  DATE_REGEX,
  parseAndValidateDate,
  isFutureDate
} from '~~/server/utils/experienceValidation'
import {
  MAX_SCHOOL,
  MAX_DEGREE,
  MAX_FIELD_OF_STUDY,
  MAX_EDUCATION_DESCRIPTION
} from '~~/server/utils/educationValidation'

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
  const { school, degree, fieldOfStudy, startDate, endDate, isCurrent, description } = body

  // Validate required fields with type guards
  if (!school || typeof school !== 'string' || school.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'School name is required'
    })
  }

  if (!degree || typeof degree !== 'string' || degree.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Degree is required'
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

  // Parse and validate startDate
  const parsedStartDate = parseAndValidateDate(startDate)
  if (!parsedStartDate) {
    throw createError({
      statusCode: 400,
      message: 'Invalid start date'
    })
  }

  // Reject future start dates
  if (isFutureDate(parsedStartDate)) {
    throw createError({
      statusCode: 400,
      message: 'Start date cannot be in the future'
    })
  }

  // Validate max lengths
  if (school.trim().length > MAX_SCHOOL) {
    throw createError({
      statusCode: 400,
      message: `School name too long (max ${MAX_SCHOOL} characters)`
    })
  }

  if (degree.trim().length > MAX_DEGREE) {
    throw createError({
      statusCode: 400,
      message: `Degree too long (max ${MAX_DEGREE} characters)`
    })
  }

  // Safe optional fields with type guards
  const safeFieldOfStudy = typeof fieldOfStudy === 'string' ? fieldOfStudy.trim() : null
  if (safeFieldOfStudy && safeFieldOfStudy.length > MAX_FIELD_OF_STUDY) {
    throw createError({
      statusCode: 400,
      message: `Field of study too long (max ${MAX_FIELD_OF_STUDY} characters)`
    })
  }

  const safeDescription = typeof description === 'string' ? description.trim() : null
  if (safeDescription && safeDescription.length > MAX_EDUCATION_DESCRIPTION) {
    throw createError({
      statusCode: 400,
      message: `Description too long (max ${MAX_EDUCATION_DESCRIPTION} characters)`
    })
  }

  // Handle isCurrent flag
  const isCurrentlyEnrolled = isCurrent === true

  // Validate end date if provided and not currently enrolled
  let safeEndDate: string | null = null
  if (!isCurrentlyEnrolled && typeof endDate === 'string' && endDate.trim().length > 0) {
    if (!DATE_REGEX.test(endDate)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid end date format'
      })
    }

    // Validate endDate is a real date
    const parsedEndDate = parseAndValidateDate(endDate)
    if (!parsedEndDate) {
      throw createError({
        statusCode: 400,
        message: 'Invalid end date'
      })
    }

    // Validate endDate >= startDate
    if (parsedEndDate < parsedStartDate) {
      throw createError({
        statusCode: 400,
        message: 'End date cannot be before start date'
      })
    }

    safeEndDate = endDate.trim()
  }

  // Calculate next orderIndex
  const lastEducation = await db.query.education.findFirst({
    where: eq(education.portfolioId, portfolioId),
    orderBy: [desc(education.orderIndex)]
  })
  const nextOrderIndex = (lastEducation?.orderIndex ?? -1) + 1

  // Insert education
  const [created] = await db
    .insert(education)
    .values({
      portfolioId,
      school: school.trim(),
      degree: degree.trim(),
      fieldOfStudy: safeFieldOfStudy || null,
      startDate: startDate.trim(),
      endDate: safeEndDate,
      isCurrent: isCurrentlyEnrolled,
      description: safeDescription || null,
      orderIndex: nextOrderIndex
    })
    .returning()

  return created
})
