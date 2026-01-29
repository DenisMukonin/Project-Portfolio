import { unlink } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

const AVATAR_DIR = join(process.cwd(), 'public', 'avatars')

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  for (const ext of ['jpeg', 'jpg', 'png', 'gif', 'webp']) {
    try {
      await unlink(join(AVATAR_DIR, `${session.user.id}.${ext}`))
    } catch {
      // File doesn't exist
    }
  }

  const githubAvatarUrl = `https://avatars.githubusercontent.com/u/${session.user.githubId}?v=4`

  try {
    const [updatedUser] = await db
      .update(users)
      .set({ avatarUrl: githubAvatarUrl, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))
      .returning()

    return updatedUser
  } catch (error) {
    console.error('Failed to reset avatar:', error)
    throw createError({ statusCode: 500, message: 'Failed to reset avatar' })
  }
})
