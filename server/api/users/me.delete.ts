import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  await db.delete(users).where(eq(users.id, session.user.id))
  await clearUserSession(event)

  return { success: true, message: 'Account deleted successfully' }
})
