export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))

  if (isProtectedRoute && !loggedIn.value) {
    return navigateTo('/')
  }

  if (to.path === '/' && loggedIn.value) {
    return navigateTo('/dashboard')
  }
})
