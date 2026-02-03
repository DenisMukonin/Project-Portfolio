import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, education } from '~~/server/db/schema'
import { UUID_REGEX } from '~~/server/utils/experienceValidation'

interface OrderUpdate {
  id: string
  orderIndex: number
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

  // Read and validate body
  const body = await readBody(event)
  const { orders } = body as { orders: OrderUpdate[] }

  if (!Array.isArray(orders) || orders.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Orders array is required'
    })
  }

  // Validate all IDs are valid UUIDs and orderIndex is valid
  for (const order of orders) {
    if (!UUID_REGEX.test(order.id)) {
      throw createError({
        statusCode: 400,
        message: `Invalid education ID format: ${order.id}`
      })
    }
    if (typeof order.orderIndex !== 'number' || !Number.isInteger(order.orderIndex) || order.orderIndex < 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid orderIndex for education ${order.id}`
      })
    }
  }

  // Validate all education records belong to portfolio
  const educationIds = orders.map(o => o.id)

  // Check for duplicate education IDs in request
  if (new Set(educationIds).size !== educationIds.length) {
    throw createError({
      statusCode: 400,
      message: 'Duplicate education IDs in request'
    })
  }

  const existingEducation = await db.query.education.findMany({
    where: eq(education.portfolioId, portfolioId)
  })

  const existingIds = new Set(existingEducation.map(e => e.id))
  for (const educationId of educationIds) {
    if (!existingIds.has(educationId)) {
      throw createError({
        statusCode: 400,
        message: `Education ${educationId} does not belong to this portfolio`
      })
    }
  }

  // Update order indexes in a transaction to ensure atomicity
  const now = new Date()
  await db.transaction(async (tx) => {
    for (const order of orders) {
      await tx.update(education)
        .set({ orderIndex: order.orderIndex, updatedAt: now })
        .where(eq(education.id, order.id))
    }
  })

  return { success: true, updated: orders.length }
})
