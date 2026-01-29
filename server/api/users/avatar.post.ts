import { readMultipartFormData } from 'h3'
import { unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 2 * 1024 * 1024
const AVATAR_SIZE = 256
const AVATAR_DIR = join(process.cwd(), 'public', 'avatars')

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}

const uploadTimestamps = new Map<string, number>()
const RATE_LIMIT_MS = 5000

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw createError({ statusCode: 400, message: 'Неверный идентификатор пользователя' })
  }

  const now = Date.now()
  const lastUpload = uploadTimestamps.get(userId)
  if (lastUpload && now - lastUpload < RATE_LIMIT_MS) {
    throw createError({
      statusCode: 429,
      message: 'Слишком частые запросы. Подождите несколько секунд.'
    })
  }

  const formData = await readMultipartFormData(event)
  const file = formData?.find(f => f.name === 'avatar')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'Файл не загружен' })
  }

  if (!ALLOWED_TYPES.includes(file.type || '')) {
    throw createError({
      statusCode: 400,
      message: 'Неверный формат файла. Допустимы: JPG, PNG, GIF, WebP'
    })
  }

  if (file.data.length > MAX_SIZE_BYTES) {
    throw createError({
      statusCode: 400,
      message: 'Файл слишком большой. Максимум 2MB'
    })
  }

  await mkdir(AVATAR_DIR, { recursive: true }).catch(() => {})

  const ext = MIME_TO_EXT[file.type || ''] || 'png'
  const filename = `${userId}.${ext}`

  for (const oldExt of ['jpeg', 'jpg', 'png', 'gif', 'webp']) {
    await unlink(join(AVATAR_DIR, `${userId}.${oldExt}`)).catch(() => {})
  }

  try {
    await sharp(file.data)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(join(AVATAR_DIR, filename))

    uploadTimestamps.set(userId, now)

    const avatarUrl = `/avatars/${filename}`
    const [updatedUser] = await db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    return updatedUser
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    throw createError({ statusCode: 500, message: 'Не удалось загрузить аватар' })
  }
})
