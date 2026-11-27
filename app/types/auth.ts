// ─── Tipe Kredensial Autentikasi ──────────────────────────────────────────────

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
