import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, experiences } from '~~/server/db/schema'

// UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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
        message: `Invalid experience ID format: ${order.id}`
      })
    }
    if (typeof order.orderIndex !== 'number' || !Number.isInteger(order.orderIndex) || order.orderIndex < 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid orderIndex for experience ${order.id}`
      })
    }
  }

  // Validate all experiences belong to portfolio
  const experienceIds = orders.map(o => o.id)

  // Check for duplicate experience IDs in request
  if (new Set(experienceIds).size !== experienceIds.length) {
    throw createError({
      statusCode: 400,
      message: 'Duplicate experience IDs in request'
    })
  }

  const existingExperiences = await db.query.experiences.findMany({
    where: eq(experiences.portfolioId, portfolioId)
  })

  const existingIds = new Set(existingExperiences.map(e => e.id))
  for (const experienceId of experienceIds) {
    if (!existingIds.has(experienceId)) {
      throw createError({
        statusCode: 400,
        message: `Experience ${experienceId} does not belong to this portfolio`
      })
    }
  }

  // Update order indexes in a transaction to ensure atomicity
  const now = new Date()
  await db.transaction(async (tx) => {
    for (const order of orders) {
      await tx.update(experiences)
        .set({ orderIndex: order.orderIndex, updatedAt: now })
        .where(eq(experiences.id, order.id))
    }
  })

  return { success: true, updated: orders.length }
})
