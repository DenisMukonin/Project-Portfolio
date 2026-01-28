import { eq, desc } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { portfolios } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const userPortfolios = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, session.user.id))
    .orderBy(desc(portfolios.createdAt))

  return userPortfolios
})
