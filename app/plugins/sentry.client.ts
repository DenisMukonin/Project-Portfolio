// Sentry user context enrichment plugin
// Sets user info when logged in for better error tracking

interface SentryUser {
  id: string
  email?: string
  username?: string
}

interface SentryPlugin {
  setUser: (user: SentryUser | null) => void
}

export default defineNuxtPlugin((nuxtApp) => {
  const { loggedIn, user } = useUserSession()
  const sentry = nuxtApp.$sentry as SentryPlugin | undefined

  if (!sentry) return

  // Set user context if already logged in
  if (loggedIn.value && user.value) {
    sentry.setUser({
      id: String(user.value.id),
      email: user.value.email || undefined,
      username: user.value.name || undefined
    })
  }

  // Watch for session changes
  watch(loggedIn, (isLoggedIn) => {
    if (isLoggedIn && user.value) {
      sentry.setUser({
        id: String(user.value.id),
        email: user.value.email || undefined,
        username: user.value.name || undefined
      })
    } else {
      sentry.setUser(null)
    }
  })
})
