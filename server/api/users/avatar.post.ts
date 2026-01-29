import { readMultipartFormData } from 'h3'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 2 * 1024 * 1024
const AVATAR_DIR = join(process.cwd(), 'public', 'avatars')

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const formData = await readMultipartFormData(event)
  const file = formData?.find(f => f.name === 'avatar')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  if (!ALLOWED_TYPES.includes(file.type || '')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid file type. Only JPG, PNG, GIF, WebP allowed'
    })
  }

  if (file.data.length > MAX_SIZE_BYTES) {
    throw createError({
      statusCode: 400,
      message: 'File too large. Maximum size is 2MB'
    })
  }

  try {
    await mkdir(AVATAR_DIR, { recursive: true })
  } catch {
    // Directory already exists
  }

  const ext = MIME_TO_EXT[file.type || ''] || 'png'
  const filename = `${session.user.id}.${ext}`

  for (const oldExt of ['jpeg', 'jpg', 'png', 'gif', 'webp']) {
    try {
      await unlink(join(AVATAR_DIR, `${session.user.id}.${oldExt}`))
    } catch {
      // File doesn't exist
    }
  }

  try {
    await writeFile(join(AVATAR_DIR, filename), file.data)

    const avatarUrl = `/avatars/${filename}`
    const [updatedUser] = await db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))
      .returning()

    return updatedUser
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    throw createError({ statusCode: 500, message: 'Failed to upload avatar' })
  }
})
