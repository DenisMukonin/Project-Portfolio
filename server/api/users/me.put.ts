import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)

  if (body.name !== undefined && body.name !== null) {
    if (typeof body.name !== 'string') {
      throw createError({ statusCode: 400, message: 'Name must be a string' })
    }

    if (body.name.length > 100) {
      throw createError({ statusCode: 400, message: 'Name must be 100 characters or less' })
    }
  }

  const nameValue = body.name?.trim() || null

  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        name: nameValue,
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id))
      .returning()

    return updatedUser
  } catch (error) {
    console.error('Failed to update user:', error)
    throw createError({ statusCode: 500, message: 'Failed to update profile' })
  }
})
