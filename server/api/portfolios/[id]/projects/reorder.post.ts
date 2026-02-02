import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios, projects } from '~~/server/db/schema'

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
        message: `Invalid project ID format: ${order.id}`
      })
    }
    if (typeof order.orderIndex !== 'number' || !Number.isInteger(order.orderIndex) || order.orderIndex < 0) {
      throw createError({
        statusCode: 400,
        message: `Invalid orderIndex for project ${order.id}`
      })
    }
  }

  // Validate all projects belong to portfolio
  const projectIds = orders.map(o => o.id)

  // Check for duplicate project IDs in request
  if (new Set(projectIds).size !== projectIds.length) {
    throw createError({
      statusCode: 400,
      message: 'Duplicate project IDs in request'
    })
  }

  const existingProjects = await db.query.projects.findMany({
    where: eq(projects.portfolioId, portfolioId)
  })

  const existingIds = new Set(existingProjects.map(p => p.id))
  for (const projectId of projectIds) {
    if (!existingIds.has(projectId)) {
      throw createError({
        statusCode: 400,
        message: `Project ${projectId} does not belong to this portfolio`
      })
    }
  }

  // Update order indexes in a transaction to ensure atomicity
  const now = new Date()
  await db.transaction(async (tx) => {
    for (const order of orders) {
      await tx.update(projects)
        .set({ orderIndex: order.orderIndex, updatedAt: now })
        .where(eq(projects.id, order.id))
    }
  })

  return { success: true, updated: orders.length }
})
