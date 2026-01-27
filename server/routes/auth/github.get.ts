import { eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { users } from '../../db/schema'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: ['user:email', 'read:user']
  },
  async onSuccess(event, { user: githubUser }) {
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.githubId, String(githubUser.id)))
      .limit(1)

    let dbUser = existingUser[0]

    if (!dbUser) {
      const [newUser] = await db.insert(users)
        .values({
          githubId: String(githubUser.id),
          email: githubUser.email,
          name: githubUser.name,
          username: githubUser.login,
          avatarUrl: githubUser.avatar_url
        })
        .returning()
      dbUser = newUser!
    }

    await setUserSession(event, {
      user: {
        id: dbUser.id,
        githubId: dbUser.githubId,
        email: dbUser.email,
        name: dbUser.name,
        username: dbUser.username,
        avatarUrl: dbUser.avatarUrl
      },
      loggedInAt: Date.now()
    })

    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/?error=github_auth_failed')
  }
})
