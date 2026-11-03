export default defineNuxtRouteMiddleware(async (to) => {
  // Callback OAuth menangani sesinya sendiri, jangan diintersep.
  if (to.path === '/auth/callback') {
    return
  }

  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.includes(to.path)

  let isAuthenticated = !!user.value

  // Plugin server Supabase sudah mengisi user dari cookie, jadi fallback
  // getSession() hanya perlu di client (misal setelah hard refresh).
  if (!isAuthenticated && import.meta.client) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        isAuthenticated = true
      }
    } catch (err) {
      console.error('Auth middleware getSession error:', err)
    }
  }

  // Halaman auth hanya untuk tamu. /reset-password sengaja tidak termasuk:
  // user yang membuka tautan recovery email punya sesi aktif dan harus tetap
  // bisa mengganti kata sandi.
  const guestOnlyRoutes = ['/', '/login', '/register', '/forgot-password']
  if (isAuthenticated && guestOnlyRoutes.includes(to.path)) {
    return navigateTo('/dashboard', { replace: true })
  }

  // Belum login dan mencoba akses route terproteksi -> lempar ke /login
  if (!isAuthenticated && !isPublicRoute) {
    return navigateTo('/login', { replace: true })
  }
})
