export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.includes(to.path)

  let isAuthenticated = !!user.value
  if (!isAuthenticated) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      isAuthenticated = true
      ;(user as any).value = session.user
    }
  }

  // 1. Jika belum login dan mencoba akses route yang diproteksi -> arahkan ke /login
  if (!isAuthenticated && !isPublicRoute) {
    return navigateTo('/login')
  }

  // 2. Jika sudah login dan mencoba akses /login, /register, /forgot-password -> arahkan ke dashboard (/)
  // Kecuali untuk halaman /reset-password yang memang butuh sesi recovery user
  if (isAuthenticated && isPublicRoute && to.path !== '/reset-password') {
    return navigateTo('/')
  }
})
