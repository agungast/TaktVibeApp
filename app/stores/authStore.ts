import { defineStore } from 'pinia'
import { useToastStore } from '~/stores/toastStore'
import type { LoginCredentials, RegisterCredentials } from '~/types/auth'

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
  const localFullName = ref<string | null>(null)

  // ─── Getters ──────────────────────────────────────────────────────────────────
  const isAuthenticated = computed<boolean>(() => !!user.value)

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
   * Keluar dari sesi (Sign Out)
   */
  async function signOut(): Promise<void> {
    loading.value = true
    try {
      const taskStore = useTaskStore()
      taskStore.resetState()

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

  // ─── State Modal Profil ───────────────────────────────────────────────────────
  const showProfileModal = ref<boolean>(false)
  const profileLoading = ref<boolean>(false)
  const profileError = ref<string | null>(null)
  const profileSuccess = ref<string | null>(null)

  const avatarUrl = computed<string | null>(() => {
    if (localAvatarUrl.value !== null) {
      return localAvatarUrl.value === '' ? null : localAvatarUrl.value
    }
    return user.value?.user_metadata?.avatar_url || null
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
      let avatarPublicUrl = user.value.user_metadata?.avatar_url || null

      // 1. Jika user meminta hapus avatar
      if (payload.removeAvatar) {
        avatarPublicUrl = null
      }
      // 2. Jika user mengunggah file foto avatar baru
      else if (payload.avatarFile) {
        const fileExt = payload.avatarFile.name.split('.').pop() || 'png'
        // Simpan dalam folder public/ agar dapat dibaca publik tanpa RLS restriction
        const filePath = `public/avatars/${user.value.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('project-crud')
          .upload(filePath, payload.avatarFile, {
            cacheControl: '3600',
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
      }

      // 3. Susun data update untuk Supabase Auth
      const updateData: {
        data: {
          full_name: string
          avatar_url: string | null
        }
        password?: string
      } = {
        data: {
          full_name: payload.fullName.trim(),
          avatar_url: avatarPublicUrl
        }
      }

      if (payload.newPassword && payload.newPassword.trim().length >= 6) {
        updateData.password = payload.newPassword.trim()
      }

      const { data, error } = await supabase.auth.updateUser(updateData)

      if (error) {
        profileError.value = translateAuthError(error.message)
        return false
      }

      if (data?.user) {
        (user as any).value = data.user
        localAvatarUrl.value = avatarPublicUrl ?? ''
        localFullName.value = payload.fullName.trim()
        profileSuccess.value = 'Profil Anda berhasil diperbarui!'
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
