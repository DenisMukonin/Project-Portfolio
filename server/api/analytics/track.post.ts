import { db } from '~~/server/utils/db'
import { viewEvents } from '~~/server/db/schema'

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface TrackRequestBody {
  portfolioId: string
  referrer?: string | null
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TrackRequestBody>(event)

  // Extract portfolioId from body (AC: #1)
  const { portfolioId, referrer } = body

  if (!portfolioId) {
    throw createError({ statusCode: 400, message: 'portfolioId is required' })
  }

  // Validate portfolioId is a valid UUID (M2 fix)
  if (!UUID_REGEX.test(portfolioId)) {
    throw createError({ statusCode: 400, message: 'portfolioId must be a valid UUID' })
  }

  // Get User-Agent from headers (AC: #1)
  const userAgent = getHeader(event, 'user-agent') || null

  // Insert view event into database (AC: #1, #2)
  // Non-blocking on client side, but we await here for consistency
  await db.insert(viewEvents).values({
    portfolioId,
    userAgent,
    referrer: referrer || null
  })

  // Return success immediately (AC: #3)
  return { success: true }
})
