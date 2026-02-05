import { eq, and, gte, sql, count } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { viewEvents, portfolios } from '~~/server/db/schema'

interface ChartDataPoint {
  date: string
  views: number
}

interface AnalyticsResponse {
  totalViews: number
  thirtyDayViews: number
  chartData: ChartDataPoint[]
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event): Promise<AnalyticsResponse> => {
  const session = await requireUserSession(event)
  const portfolioId = getRouterParam(event, 'id')

  if (!portfolioId) {
    throw createError({ statusCode: 400, message: 'Portfolio ID is required' })
  }

  // M1 fix: Validate UUID format before database query
  if (!UUID_REGEX.test(portfolioId)) {
    throw createError({ statusCode: 400, message: 'Invalid portfolio ID format' })
  }

  // Verify portfolio ownership (AC: security)
  const portfolio = await db.query.portfolios.findFirst({
    where: and(
      eq(portfolios.id, portfolioId),
      eq(portfolios.userId, session.user.id)
    )
  })

  if (!portfolio) {
    throw createError({ statusCode: 404, message: 'Portfolio not found' })
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Total views - all time (AC: #1)
  const totalResult = await db
    .select({ count: count() })
    .from(viewEvents)
    .where(eq(viewEvents.portfolioId, portfolioId))

  const totalViews = totalResult[0]?.count ?? 0

  // Views per day for last 7 days (AC: #2)
  // M2 fix: Use UTC timezone consistently for date comparison
  const dailyViews = await db
    .select({
      date: sql<string>`DATE(${viewEvents.viewedAt} AT TIME ZONE 'UTC')`.as('date'),
      count: count()
    })
    .from(viewEvents)
    .where(and(
      eq(viewEvents.portfolioId, portfolioId),
      gte(viewEvents.viewedAt, sevenDaysAgo)
    ))
    .groupBy(sql`DATE(${viewEvents.viewedAt} AT TIME ZONE 'UTC')`)
    .orderBy(sql`DATE(${viewEvents.viewedAt} AT TIME ZONE 'UTC')`)

  // Views for last 30 days (AC: #3)
  const thirtyDayResult = await db
    .select({ count: count() })
    .from(viewEvents)
    .where(and(
      eq(viewEvents.portfolioId, portfolioId),
      gte(viewEvents.viewedAt, thirtyDaysAgo)
    ))

  const thirtyDayViews = thirtyDayResult[0]?.count ?? 0

  // Fill in missing days for last 7 days chart (AC: #2)
  const chartData: ChartDataPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0] as string
    const dayData = dailyViews.find(d => d.date === dateStr)
    chartData.push({
      date: dateStr,
      views: dayData?.count ?? 0
    })
  }

  return {
    totalViews,
    thirtyDayViews,
    chartData
  }
})
