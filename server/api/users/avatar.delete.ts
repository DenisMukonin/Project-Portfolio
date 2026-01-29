import { unlink } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

const AVATAR_DIR = join(process.cwd(), 'public', 'avatars')

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw createError({ statusCode: 400, message: 'Неверный идентификатор пользователя' })
  }

  for (const ext of ['jpeg', 'jpg', 'png', 'gif', 'webp']) {
    await unlink(join(AVATAR_DIR, `${userId}.${ext}`)).catch(() => {})
  }

  const githubAvatarUrl = `https://avatars.githubusercontent.com/u/${session.user.githubId}?v=4`

  try {
    const [updatedUser] = await db
      .update(users)
      .set({ avatarUrl: githubAvatarUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    return updatedUser
  } catch (error) {
    console.error('Failed to reset avatar:', error)
    throw createError({ statusCode: 500, message: 'Не удалось сбросить аватар' })
  }
})
