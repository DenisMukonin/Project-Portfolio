// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryClient = any

export default defineNuxtPlugin((nuxtApp) => {
  const { loggedIn, user } = useUserSession()
  const sentry = nuxtApp.$sentry as SentryClient | undefined

  if (!sentry) return

  // Wait for user session to be ready
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
