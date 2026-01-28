import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  try {
    await db.delete(users).where(eq(users.id, session.user.id))
    await clearUserSession(event)
    return { success: true, message: 'Account deleted successfully' }
  } catch (error) {
    console.error('Account deletion failed:', error)
    throw createError({ statusCode: 500, message: 'Failed to delete account' })
  }
})
