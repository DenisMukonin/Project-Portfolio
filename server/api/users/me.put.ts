import { eq } from 'drizzle-orm'
import { db } from '~~/server/utils/db'
import { users } from '~~/server/db/schema'
import type { SocialLinks } from '~~/shared/types/social-links'

const MAX_FIELD_LENGTH = 100
const MAX_BIO_LENGTH = 1000
const MAX_URL_LENGTH = 200

function isValidUrl(url: string): boolean {
  if (!url) return true // Empty is valid (means "remove link")
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)

  // Build update object - only include fields that were explicitly sent
  const updateData: { name?: string | null, title?: string | null, bio?: string | null, socialLinks?: SocialLinks | null, updatedAt: Date } = {
    updatedAt: new Date()
  }

  // Validate and add name if provided
  if (body.name !== undefined) {
    if (body.name !== null && typeof body.name !== 'string') {
      throw createError({ statusCode: 400, message: 'Name must be a string' })
    }

    const nameValue = typeof body.name === 'string' ? body.name.trim() : null

    if (nameValue && nameValue.length > MAX_FIELD_LENGTH) {
      throw createError({ statusCode: 400, message: `Name must be ${MAX_FIELD_LENGTH} characters or less` })
    }

    updateData.name = nameValue || null
  }

  // Validate and add title if provided
  if (body.title !== undefined) {
    if (body.title !== null && typeof body.title !== 'string') {
      throw createError({ statusCode: 400, message: 'Title must be a string' })
    }

    const titleValue = typeof body.title === 'string' ? body.title.trim() : null

    if (titleValue && titleValue.length > MAX_FIELD_LENGTH) {
      throw createError({ statusCode: 400, message: `Title must be ${MAX_FIELD_LENGTH} characters or less` })
    }

    updateData.title = titleValue || null
  }

  // Validate and add bio if provided
  if (body.bio !== undefined) {
    if (body.bio !== null && typeof body.bio !== 'string') {
      throw createError({ statusCode: 400, message: 'Bio must be a string' })
    }

    const bioValue = typeof body.bio === 'string' ? body.bio.trim() : null

    if (bioValue && bioValue.length > MAX_BIO_LENGTH) {
      throw createError({ statusCode: 400, message: `Bio must be ${MAX_BIO_LENGTH} characters or less` })
    }

    updateData.bio = bioValue || null
  }

  // Validate and add socialLinks if provided
  if (body.socialLinks !== undefined) {
    const links = body.socialLinks

    if (links !== null && typeof links !== 'object') {
      throw createError({ statusCode: 400, message: 'Social links must be an object' })
    }

    const validKeys = ['github', 'linkedin', 'twitter', 'website'] as const
    const sanitized: SocialLinks = {}

    if (links) {
      for (const key of validKeys) {
        const value = links[key]
        if (value !== undefined) {
          if (typeof value !== 'string') {
            throw createError({ statusCode: 400, message: `${key} must be a string` })
          }
          const trimmed = value.trim()
          if (trimmed && !isValidUrl(trimmed)) {
            throw createError({ statusCode: 400, message: `Invalid URL for ${key}` })
          }
          if (trimmed.length > MAX_URL_LENGTH) {
            throw createError({ statusCode: 400, message: `URL for ${key} is too long` })
          }
          if (trimmed) {
            sanitized[key] = trimmed
          }
        }
      }
    }

    updateData.socialLinks = Object.keys(sanitized).length > 0 ? sanitized : null
  }

  try {
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning()

    return updatedUser
  } catch (error) {
    console.error('Failed to update user:', error)
    throw createError({ statusCode: 500, message: 'Failed to update profile' })
  }
})
