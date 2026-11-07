// ─── Tipe Kredensial & State Autentikasi ──────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  fullName?: string
  email: string
  password: string
  confirmPassword?: string
}

export interface UserProfile {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
}

export interface AuthState {
  loading: boolean
  authError: string | null
  successMessage: string | null
}
