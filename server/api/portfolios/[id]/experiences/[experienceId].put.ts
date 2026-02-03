import { eq, and } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, experiences } from '~~/server/db/schema'
import {
  UUID_REGEX,
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
  const experienceId = getRouterParam(event, 'experienceId')

  // Validate required IDs
  if (!portfolioId || !experienceId) {
    throw createError({
      statusCode: 400,
      message: 'Portfolio ID and Experience ID are required'
    })
  }

  // Validate UUID format
  if (!UUID_REGEX.test(portfolioId) || !UUID_REGEX.test(experienceId)) {
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

  // Validate experience belongs to portfolio
  const experience = await db.query.experiences.findFirst({
    where: and(
      eq(experiences.id, experienceId),
      eq(experiences.portfolioId, portfolioId)
    )
  })

  if (!experience) {
    throw createError({ statusCode: 404, message: 'Experience not found' })
  }

  // Read and validate body
  const body = await readBody(event)
  const { title, company, location, startDate, endDate, isCurrent, description } = body

  // Build update object
  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  // Validate and set title (required)
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Job title is required'
      })
    }
    if (title.trim().length > MAX_TITLE) {
      throw createError({
        statusCode: 400,
        message: `Job title too long (max ${MAX_TITLE} characters)`
      })
    }
    updateData.title = title.trim()
  }

  // Validate and set company (required)
  if (company !== undefined) {
    if (typeof company !== 'string' || company.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Company name is required'
      })
    }
    if (company.trim().length > MAX_COMPANY) {
      throw createError({
        statusCode: 400,
        message: `Company name too long (max ${MAX_COMPANY} characters)`
      })
    }
    updateData.company = company.trim()
  }

  // Validate and set location (optional)
  if (location !== undefined) {
    const safeLocation = typeof location === 'string' ? location.trim() : null
    if (safeLocation && safeLocation.length > MAX_LOCATION) {
      throw createError({
        statusCode: 400,
        message: `Location too long (max ${MAX_LOCATION} characters)`
      })
    }
    updateData.location = safeLocation || null
  }

  // Validate and set description (optional)
  if (description !== undefined) {
    const safeDescription = typeof description === 'string' ? description.trim() : null
    if (safeDescription && safeDescription.length > MAX_DESCRIPTION) {
      throw createError({
        statusCode: 400,
        message: `Description too long (max ${MAX_DESCRIPTION} characters)`
      })
    }
    updateData.description = safeDescription || null
  }

  // Handle isCurrent flag
  const isCurrentJob = isCurrent === true
  if (isCurrent !== undefined) {
    updateData.isCurrent = isCurrentJob
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

    updateData.startDate = startDate.trim()
  }

  // Validate and set endDate
  if (endDate !== undefined || isCurrent !== undefined) {
    if (isCurrentJob) {
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
          || parseAndValidateDate(experience.startDate)

        if (effectiveStartDate && parsedEndDate < effectiveStartDate) {
          throw createError({
            statusCode: 400,
            message: 'End date cannot be before start date'
          })
        }

        updateData.endDate = endDate.trim()
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

  // Update experience
  const [updated] = await db
    .update(experiences)
    .set(updateData)
    .where(eq(experiences.id, experienceId))
    .returning()

  return updated
})
