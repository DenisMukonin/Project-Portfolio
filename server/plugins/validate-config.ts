export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const sessionPassword = config.session?.password || ''

  if (sessionPassword.length < 32) {
    throw new Error(
      'NUXT_SESSION_PASSWORD must be at least 32 characters for secure session encryption. '
      + 'Generate one with: openssl rand -hex 32'
    )
  }
})
