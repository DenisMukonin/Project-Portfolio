export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (url.pathname.startsWith('/api/protected')) {
    await requireUserSession(event)
  }
})
