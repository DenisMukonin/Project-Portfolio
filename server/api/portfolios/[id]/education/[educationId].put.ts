import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, education } from '~~/server/db/schema'
import {
  UUID_REGEX,
  parseAndValidateDate,
  isFutureDate,
  toDbDate
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

  // Read and validate body
  const body = await readBody(event)
  const { school, degree, fieldOfStudy, startDate, endDate, isCurrent, description } = body

  // Build update object
  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  // Validate and set school (required)
  if (school !== undefined) {
    if (typeof school !== 'string' || school.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'School name is required'
      })
    }
    if (school.trim().length > MAX_SCHOOL) {
      throw createError({
        statusCode: 400,
        message: `School name too long (max ${MAX_SCHOOL} characters)`
      })
    }
    updateData.school = school.trim()
  }

  // Validate and set degree (required)
  if (degree !== undefined) {
    if (typeof degree !== 'string' || degree.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Degree is required'
      })
    }
    if (degree.trim().length > MAX_DEGREE) {
      throw createError({
        statusCode: 400,
        message: `Degree too long (max ${MAX_DEGREE} characters)`
      })
    }
    updateData.degree = degree.trim()
  }

  // Validate and set fieldOfStudy (optional)
  if (fieldOfStudy !== undefined) {
    const safeFieldOfStudy = typeof fieldOfStudy === 'string' ? fieldOfStudy.trim() : null
    if (safeFieldOfStudy && safeFieldOfStudy.length > MAX_FIELD_OF_STUDY) {
      throw createError({
        statusCode: 400,
        message: `Field of study too long (max ${MAX_FIELD_OF_STUDY} characters)`
      })
    }
    updateData.fieldOfStudy = safeFieldOfStudy || null
  }

  // Validate and set description (optional)
  if (description !== undefined) {
    const safeDescription = typeof description === 'string' ? description.trim() : null
    if (safeDescription && safeDescription.length > MAX_EDUCATION_DESCRIPTION) {
      throw createError({
        statusCode: 400,
        message: `Description too long (max ${MAX_EDUCATION_DESCRIPTION} characters)`
      })
    }
    updateData.description = safeDescription || null
  }

  // Handle isCurrent flag
  const isCurrentEducation = isCurrent === true
  if (isCurrent !== undefined) {
    updateData.isCurrent = isCurrentEducation
  }

  // Validate and set startDate
  let parsedStartDate: Date | null = null
  if (startDate !== undefined) {
    if (typeof startDate !== 'string' || startDate.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Start date is required'
      })
    }

    parsedStartDate = parseAndValidateDate(startDate)
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

    updateData.startDate = toDbDate(startDate.trim())
  }

  // Validate and set endDate
  if (endDate !== undefined || isCurrent !== undefined) {
    if (isCurrentEducation) {
      // Clear endDate when isCurrent is true
      updateData.endDate = null
    } else if (endDate !== undefined) {
      if (typeof endDate === 'string' && endDate.trim().length > 0) {
        const parsedEndDate = parseAndValidateDate(endDate)
        if (!parsedEndDate) {
          throw createError({
            statusCode: 400,
            message: 'Invalid end date'
          })
        }

        // Validate endDate >= startDate
        // Use the new startDate if provided, otherwise use existing
        const effectiveStartDate = parsedStartDate
          || parseAndValidateDate(educationRecord.startDate)

        if (effectiveStartDate && parsedEndDate < effectiveStartDate) {
          throw createError({
            statusCode: 400,
            message: 'End date cannot be before start date'
          })
        }

        updateData.endDate = toDbDate(endDate.trim())
      } else {
        // Allow clearing endDate by setting to null
        updateData.endDate = null
      }
    }
  }

  // Check if there's anything to update (besides updatedAt)
  if (Object.keys(updateData).length === 1) {
    throw createError({
      statusCode: 400,
      message: 'No valid fields to update'
    })
  }

  // Update education
  const [updated] = await db
    .update(education)
    .set(updateData)
    .where(eq(education.id, educationId))
    .returning()

  return updated
})
