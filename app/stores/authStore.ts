import { defineStore } from 'pinia'
import { useToastStore } from '~/stores/toastStore'
import type { LoginCredentials, RegisterCredentials } from '~/types/auth'
import { nextTick } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const toast = {
    error: (msg: string, title?: string) => useToastStore().error(msg, title),
    success: (msg: string, title?: string) => useToastStore().success(msg, title),
    info: (msg: string, title?: string) => useToastStore().addToast({ message: msg, type: 'info', title })
  }

  // ─── State ────────────────────────────────────────────────────────────────────
  const loading = ref<boolean>(false)
  const authError = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const showLogoutModal = ref<boolean>(false)
  const localAvatarUrl = ref<string | null>(null)
  try {
    const saved = localStorage.getItem('avatar_url')
    if (saved === 'null') localAvatarUrl.value = null
    else if (saved === '') localAvatarUrl.value = ''
    else if (saved !== null) localAvatarUrl.value = saved || null
  } catch {}
  watch(localAvatarUrl, (v) => {
    try { localStorage.setItem('avatar_url', v === null ? 'null' : (v ?? '')) } catch {}
  })
  const localFullName = ref<string | null>(null)
  const avatarDeleted = ref<boolean>(false)
  try {
    const saved = localStorage.getItem('avatar_deleted')
    if (saved === '1') avatarDeleted.value = true
  } catch {}
  watch(avatarDeleted, (v) => {
    try { localStorage.setItem('avatar_deleted', v ? '1' : '0') } catch {}
  })

  // ─── Getters ──────────────────────────────────────────────────────────────────
  const isAuthenticated = computed<boolean>(() => !!user.value)

  watch(user, async (newUser, oldUser) => {
    // Hanya reset saat user benar-benar berganti (bukan saat inisialisasi pertama)
    if (oldUser && newUser?.id !== oldUser?.id) {
      // User berganti (login/logout) — coba sync dari tabel profiles berdasarkan email
      // agar foto konsisten antara manual dan Google
      const email = newUser?.email
      if (email) {
        try {
          await syncFromProfiles()
          const { data: profileData } = await supabase.from('profiles').select('full_name').eq('email', email).maybeSingle()
          if (profileData?.full_name) {
            localFullName.value = profileData.full_name
          }
        } catch {
          if (!localAvatarUrl.value) {
            localAvatarUrl.value = null
            localFullName.value = null
          }
        }
      } else {
        if (!localAvatarUrl.value) {
          localAvatarUrl.value = null
          localFullName.value = null
        }
      }
    }

    // Hydrate local state dari user_metadata saat session restore (hard refresh)
    // Hanya sinkronkan jika localAvatarUrl masih null (belum di-set di sesi ini)
    if (newUser && localAvatarUrl.value === null) {
      syncAvatarFromSession(newUser)
    }
  })

  async function syncFromProfiles(force = false): Promise<void> {
    const email = user.value?.email
    if (!email) return
    try {
      const { data: profileData } = await supabase.from('profiles').select('avatar_url').eq('email', email).maybeSingle()
      if (profileData?.avatar_url) {
        localAvatarUrl.value = profileData.avatar_url
        avatarDeleted.value = false
        try { sessionStorage.setItem(`profile_avatar_${email}`, profileData.avatar_url) } catch {}
      } else {
        avatarDeleted.value = true
        localAvatarUrl.value = ''
        try { sessionStorage.setItem(`profile_avatar_${email}`, '__deleted__') } catch {}
      }
    } catch {}
  }

  const userEmail = computed<string>(() => user.value?.email ?? '')

  const displayName = computed<string>(() => {
    // 1. Coba ambil dari local state atau user_metadata (full_name / name)
    const rawName = localFullName.value || user.value?.user_metadata?.full_name || user.value?.user_metadata?.name
    if (rawName && typeof rawName === 'string' && rawName.trim()) {
      return rawName.trim()
    }
    // 2. Fallback ke potongan email
    const email = user.value?.email
    if (!email) return 'User'
    const namePart = email.split('@')[0] || 'User'
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
  })

  const userInitials = computed<string>(() => {
    // 1. Coba ambil inisial dari full_name jika ada
    const rawName = localFullName.value || user.value?.user_metadata?.full_name || user.value?.user_metadata?.name
    if (rawName && typeof rawName === 'string' && rawName.trim()) {
      const parts = rawName.trim().split(/\s+/)
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return ((parts[0][0] || '') + (parts[1][0] || '')).toUpperCase()
      }
      return rawName.trim().charAt(0).toUpperCase()
    }
    // 2. Fallback ke huruf awal email
    const email = user.value?.email
    if (!email) return 'U'
    return email.charAt(0).toUpperCase() || 'U'
  })

  // ─── Actions ──────────────────────────────────────────────────────────────────
  function clearMessages(): void {
    authError.value = null
    successMessage.value = null
  }

  /**
   * Helper: deteksi apakah URL adalah URL dari OAuth provider (bukan Supabase Storage kita)
   */
  function isOAuthProviderAvatarUrl(url: string): boolean {
    return (
      url.includes('googleusercontent.com') ||
      url.includes('githubusercontent.com') ||
      url.includes('graph.facebook.com') ||
      url.includes('avatars.githubusercontent.com')
    )
  }

  /**
   * Sinkronisasi avatar dari OAuth provider setelah login/session restore.
   * Dipanggil untuk memastikan identity_data di-hydrate ke localAvatarUrl
   * hanya jika user belum memiliki custom uploaded avatar.
   */
  function syncAvatarFromSession(currentUser: typeof user.value): void {
    if (!currentUser) return
    // Jangan override jika user sudah sengaja menghapus avatar (lokal maupun persisten)
    if (localAvatarUrl.value === '' || avatarDeleted.value) return

    const meta = currentUser.user_metadata as any
    const storedAvatar: string | undefined = meta?.avatar_url

    // Jika ada custom upload di Supabase Storage, hydrate ke localAvatarUrl
    if (storedAvatar && !isOAuthProviderAvatarUrl(storedAvatar)) {
      localAvatarUrl.value = storedAvatar
    }
    // Jika tidak ada custom upload, biarkan localAvatarUrl null
    // agar computed avatarUrl mengambil langsung dari identity_data
  }

  /**
   * Masuk menggunakan Email dan Password
   */
  async function signIn(credentials: LoginCredentials): Promise<boolean> {
    loading.value = true
    clearMessages()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        const errorMsg = translateAuthError(error.message)
        authError.value = errorMsg
        toast.error(errorMsg)
        return false
      }

      if (data?.user) {
        ;(user as any).value = data.user
        hydrateAvatarFromMeta()
        return true
      }

      return false
    } catch (err: any) {
      const errorMsg = err.message || 'Terjadi kesalahan saat masuk.'
      authError.value = errorMsg
      toast.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Mendaftar akun baru dengan Email, Password, dan Nama Lengkap
   */
  async function signUp(credentials: RegisterCredentials): Promise<boolean> {
    loading.value = true
    clearMessages()

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName?.trim() || ''
          }
        }
      })

      if (error) {
        const errorMsg = translateAuthError(error.message)
        authError.value = errorMsg
        toast.error(errorMsg)
        return false
      }

      if (data?.user) {
        // Cek apakah Supabase memerlukan konfirmasi email
        if (data.session) {
          // Jika Confirm Email OFF: Akhiri auto-login sesi dan arahkan ke login
          toast.success('Akun berhasil dibuat! Silakan masuk.')
          await supabase.auth.signOut()
          await navigateTo('/login?registered=success', { replace: true })
        } else {
          // Jika Confirm Email ON: Arahkan ke login dengan instruksi verifikasi
          toast.info('Pendaftaran berhasil! Silakan periksa email untuk verifikasi.')
          await navigateTo('/login?registered=verify', { replace: true })
        }
        return true
      }

      return false
    } catch (err: any) {
      const errorMsg = err.message || 'Terjadi kesalahan saat pendaftaran.'
      authError.value = errorMsg
      toast.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Masuk menggunakan OAuth (Google / GitHub)
   */
  async function signInWithOAuth(provider: 'google' | 'github'): Promise<boolean> {
    loading.value = true
    clearMessages()
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false
        }
      })
      if (error) {
        authError.value = translateAuthError(error.message)
        toast.error(authError.value || 'Gagal masuk dengan OAuth.')
        return false
      }
      // Setelah OAuth callback berhasil, sinkron avatar dari metadata
      await nextTick()
      try {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          (user as any).value = data.user
          const email = data.user.email
          // Prioritaskan data dari tabel profiles berdasarkan email
          if (email) {
            try {
              await syncFromProfiles()
              const { data: profileData } = await supabase.from('profiles').select('full_name').eq('email', email).maybeSingle()
              if (profileData?.full_name) {
                localFullName.value = profileData.full_name
              }
            } catch {}
          }
          if (avatarDeleted.value) return true
          hydrateAvatarFromMeta()
        }
      } catch {}
      return true
    } catch (err: any) {
      authError.value = err.message || 'Gagal masuk dengan OAuth.'
      toast.error(authError.value || 'Gagal masuk dengan OAuth.')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Keluar dari sesi (Sign Out)
   */
  async function signOut(): Promise<void> {
    loading.value = true
    try {
      const taskStore = useTaskStore()
      taskStore.resetState()

      localAvatarUrl.value = null
      localFullName.value = null

      const { error } = await supabase.auth.signOut()
      ;(user as any).value = null
      if (error) {
        console.error('Error signing out:', error.message)
      }
      try {
        await navigateTo('/login', { replace: true })
      } catch {
        if (import.meta.client) {
          window.location.href = '/login'
        }
      }
    } catch (err) {
      console.error('Sign out error:', err)
      await navigateTo('/login', { replace: true })
    } finally {
      loading.value = false
    }
  }

  /**
   * Mengirim tautan reset password ke email
   */
  async function sendPasswordReset(email: string): Promise<boolean> {
    loading.value = true
    clearMessages()

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) {
        authError.value = translateAuthError(error.message)
        return false
      }

      successMessage.value = 'Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk (atau spam) email Anda.'
      return true
    } catch (err: any) {
      authError.value = err.message || 'Gagal mengirim email reset kata sandi.'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Menyimpan kata sandi baru (setelah user klik link reset dari email)
   */
  async function updatePassword(newPassword: string): Promise<boolean> {
    loading.value = true
    clearMessages()

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        authError.value = translateAuthError(error.message)
        return false
      }

      // Selesaikan sesi pemulihan dan alihkan ke halaman login
      await supabase.auth.signOut()
      const taskStore = useTaskStore()
      taskStore.resetState()

      await navigateTo('/login?reset=success', { replace: true })
      return true
    } catch (err: any) {
      authError.value = err.message || 'Gagal memperbarui kata sandi.'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Helper untuk menerjemahkan pesan error umum Supabase ke Bahasa Indonesia
   */
  function translateAuthError(msg: string): string {
    const lower = msg.toLowerCase()
    if (lower.includes('invalid login credentials')) {
      return 'Email atau kata sandi tidak valid. Silakan periksa kembali.'
    }
    if (lower.includes('email not confirmed')) {
      return 'Email Anda belum dikonfirmasi. Silakan periksa email verifikasi Anda.'
    }
    if (lower.includes('user already registered')) {
      return 'Email ini sudah terdaftar. Silakan langsung masuk.'
    }
    if (lower.includes('password should be at least')) {
      return 'Kata sandi minimal harus terdiri dari 6 karakter.'
    }
    if (lower.includes('rate limit') || lower.includes('rate_limit')) {
      return 'Batas pengiriman email terlampaui (Email Rate Limit). Silakan matikan "Confirm email" di Supabase Dashboard untuk proses development.'
    }
    if (lower.includes('auth session missing') || lower.includes('session missing') || lower.includes('session_missing')) {
      return 'Sesi pemulihan tidak ditemukan atau tautan reset sudah kedaluwarsa. Silakan minta tautan baru lewat menu Lupa Kata Sandi.'
    }
    return msg
  }

  // ─── Helper sinkron avatar ────────────────────────────────────────────────────
  function hydrateAvatarFromMeta(): void {
    const meta = user.value?.user_metadata as any
    if (meta?.avatar_url) {
      localAvatarUrl.value = meta.avatar_url
    } else if (meta?.picture) {
      localAvatarUrl.value = meta.picture
    } else {
      // Biarkan null jika tidak ada; akan menggunakan identity_data nanti
      if (!localAvatarUrl.value) localAvatarUrl.value = null
    }
  }

  // ─── State Modal Profil ───────────────────────────────────────────────────────
  const showProfileModal = ref<boolean>(false)
  const profileLoading = ref<boolean>(false)
  const profileError = ref<string | null>(null)
  const profileSuccess = ref<string | null>(null)

  const avatarUrl = computed<string | null>(() => {
    if (!user.value) return null

    const meta = user.value?.user_metadata as any
    const email = user.value?.email

    // 0️⃣ Prioritaskan cache dari tabel profiles
    if (email) {
      try {
        const cached = sessionStorage.getItem(`profile_avatar_${email}`)
        if (cached === '__deleted__') return null
        if (cached) return cached
      } catch {}
    }

    // 1️⃣ Custom uploaded avatar ke Supabase Storage (selalu menang)
    //    localAvatarUrl === '' berarti avatar sengaja dihapus → return null
    if (localAvatarUrl.value !== null && localAvatarUrl.value !== undefined) {
      if (localAvatarUrl.value === '') return null
      return localAvatarUrl.value
    }

    // Jika user sudah mengeklik "Hapus Foto" + "Simpan", semua fallback
    // (metadata & OAuth identity) harus diabaikan → default inisial
    if (avatarDeleted.value) return null

    // 2️⃣ Cek user_metadata.avatar_url — valid hanya jika bukan URL OAuth provider
    //    (berarti ini URL custom upload dari Supabase Storage yang tersimpan di metadata)
    const metaAvatarUrl: string | undefined = meta?.avatar_url
    if (metaAvatarUrl && !isOAuthProviderAvatarUrl(metaAvatarUrl)) {
      return metaAvatarUrl
    }

    // 3️⃣ Ambil foto dari identity_data provider OAuth (Google/GitHub)
    //    identity_data diperbarui Supabase setiap user re-authenticate via OAuth
    const ids = user.value.identities || []
    for (const identity of ids) {
      const d = (identity as any)?.identity_data as any
      if (d?.avatar_url) return d.avatar_url
      if (d?.picture) return d.picture
    }

    // 4️⃣ Fallback terakhir: picture atau avatar_url dari user_metadata (termasuk OAuth URL)
    //    Kita abaikan picture kalau user sudah sengaja menghapus avatar secara manual
    //    (pengguna klik "Hapus Foto" + "Simpan Perubahan", jadi picture ini mesti diabaikan)
    if (avatarDeleted.value) return null
    if (meta?.picture) return meta.picture
    if (metaAvatarUrl) return metaAvatarUrl

    return null
  })

  const fullName = computed<string>(() => {
    return localFullName.value || user.value?.user_metadata?.full_name || user.value?.user_metadata?.name || ''
  })

  function openProfileModal(): void {
    profileError.value = null
    profileSuccess.value = null
    showProfileModal.value = true
  }

  function closeProfileModal(): void {
    showProfileModal.value = false
    profileError.value = null
    profileSuccess.value = null
  }

  /**
   * Memperbarui profil pengguna (Nama Lengkap, Foto Avatar, dan Kata Sandi)
   */
  async function updateUserProfile(payload: {
    fullName: string
    avatarFile?: File | null
    removeAvatar?: boolean
    newPassword?: string
  }): Promise<boolean> {
    if (!user.value) return false
    profileLoading.value = true
    profileError.value = null
    profileSuccess.value = null

    try {
      let avatarPublicUrl: string | null = null

      // 1. Jika user meminta hapus avatar
      if (payload.removeAvatar) {
        avatarPublicUrl = null
        localAvatarUrl.value = ''
        avatarDeleted.value = true
        try { const email = user.value.email; if (email) sessionStorage.setItem(`profile_avatar_${email}`, '__deleted__') } catch {}
      }
      // 2. Jika user mengunggah file foto avatar baru
      else if (payload.avatarFile) {
        const fileExt = payload.avatarFile.name.split('.').pop() || 'png'
        const filePath = `public/${user.value.id}/avatar-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('project-crud')
          .upload(filePath, payload.avatarFile, {
            cacheControl: '0',
            upsert: true
          })

        if (uploadError) {
          profileError.value = `Gagal mengunggah foto avatar: ${uploadError.message}`
          return false
        }

        const { data: urlData } = supabase.storage
          .from('project-crud')
          .getPublicUrl(filePath)

        avatarPublicUrl = urlData.publicUrl
        localAvatarUrl.value = avatarPublicUrl
        avatarDeleted.value = false
        try { const email = user.value.email; if (email) sessionStorage.setItem(`profile_avatar_${email}`, avatarPublicUrl) } catch {}
      } else {
        // 3. Tidak ada perubahan avatar — pertahankan yang sudah ada
        avatarPublicUrl = localAvatarUrl.value || (user.value.user_metadata as any)?.avatar_url || (user.value.user_metadata as any)?.picture || null
      }

      // 3. Susun data update untuk Supabase Auth
      const updateData: {
        data: {
          full_name: string
          avatar_url: string | null
          picture?: string | null
        }
        password?: string
      } = {
        data: {
          full_name: payload.fullName.trim(),
          avatar_url: avatarPublicUrl,
          picture: avatarPublicUrl
        }
      }

      if (payload.newPassword && payload.newPassword.trim().length >= 6) {
        updateData.password = payload.newPassword.trim()
      }

      const { data, error } = await supabase.auth.updateUser(updateData)

      // Refresh user metadata dari server agar perubahan avatar_url benar-benar tersinkron
      if (!error) {
        try {
          const fresh = await supabase.auth.getUser()
          if (fresh.data?.user) (user as any).value = fresh.data.user
        } catch {}
      }

      if (error) {
        profileError.value = translateAuthError(error.message)
        return false
      }

      if (data?.user) {
        // Update reaktif user object dari Supabase response (sudah memiliki user_metadata terbaru)
        // Namun kita sudah refresh dengan getUser() di atas; hanya set jika fresh gagal
        try {
          const fresh = await supabase.auth.getUser()
          if (fresh.data?.user) {
            ;(user as any).value = fresh.data.user
          } else {
            ;(user as any).value = data.user
          }
        } catch {
          ;(user as any).value = data.user
        }

        // Sinkronisasi localAvatarUrl agar konsisten dengan data yang baru disimpan
        if (payload.removeAvatar) {
          localAvatarUrl.value = ''
        } else if (avatarPublicUrl) {
          localAvatarUrl.value = avatarPublicUrl
        }
        // Jika tidak ada perubahan avatar, biarkan localAvatarUrl tetap seperti sebelumnya

        // Simpan ke tabel profiles agar akun manual & Google konsisten
        try {
          const { error: upsertError } = await supabase.from('profiles').upsert({
            email: user.value.email,
            full_name: payload.fullName.trim(),
            avatar_url: avatarPublicUrl
          }, { onConflict: 'email' })
          if (upsertError) console.error('[profiles] upsert error:', upsertError.message)
          if (!upsertError) {
            try {
              const email = user.value.email
              if (email) {
                if (avatarPublicUrl) sessionStorage.setItem(`profile_avatar_${email}`, avatarPublicUrl)
                else sessionStorage.setItem(`profile_avatar_${email}`, '__deleted__')
              }
            } catch {}
          }
        } catch (e: any) {
          console.error('[profiles] upsert error:', e.message)
        }

        localFullName.value = payload.fullName.trim()
        profileSuccess.value = 'Profil Anda berhasil diperbarui!'
        await nextTick()
        return true
      }

      return false
    } catch (err: any) {
      profileError.value = err.message || 'Terjadi kesalahan saat memperbarui profil.'
      return false
    } finally {
      profileLoading.value = false
    }
  }

  function openLogoutModal(): void {
    showLogoutModal.value = true
  }

  function closeLogoutModal(): void {
    showLogoutModal.value = false
  }

  return {
    // State
    loading,
    authError,
    successMessage,
    showLogoutModal,
    showProfileModal,
    profileLoading,
    profileError,
    profileSuccess,

    // Getters
    user,
    isAuthenticated,
    userEmail,
    displayName,
    fullName,
    userInitials,
    avatarUrl,

    // Actions
    signIn,
    signInWithOAuth,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    updateUserProfile,
    openProfileModal,
    closeProfileModal,
    openLogoutModal,
    closeLogoutModal,
    clearMessages
  }
})
