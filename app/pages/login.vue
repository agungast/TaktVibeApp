<template>
  <div class="auth-card">
    <div class="auth-card-header">
      <h2 class="auth-card-title">Selamat Datang Kembali</h2>
      <p class="auth-card-desc">Masuk ke akun TaktVibe Anda untuk melanjutkan</p>
    </div>

    <!-- Alert Success setelah Pendaftaran Akun -->
    <div v-if="registeredSuccess" class="auth-alert success">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Akun Anda berhasil dibuat! Silakan masuk dengan email dan kata sandi Anda.</span>
    </div>

    <!-- Alert Info Verifikasi Email setelah Pendaftaran -->
    <div v-if="verifyRequired" class="auth-alert info">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
      </svg>
      <span>Pendaftaran berhasil! Tautan verifikasi telah dikirimkan ke email Anda. Silakan verifikasi akun Anda sebelum masuk.</span>
    </div>

    <!-- Alert Success setelah Reset Password -->
    <div v-if="resetSuccess" class="auth-alert success">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.</span>
    </div>

    <!-- Alert Error -->
    <div v-if="authStore.authError" class="auth-alert error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ authStore.authError }}</span>
    </div>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin" class="auth-form">
      <!-- Email -->
      <div class="form-group">
        <label class="form-label" for="login-email">Email</label>
        <div class="input-wrap">
          <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            required
            placeholder="Masukkan email"
            class="form-input"
            :disabled="authStore.loading"
          />
        </div>
      </div>

      <!-- Password -->
      <div class="form-group">
        <div class="label-row">
          <label class="form-label" for="login-password">Kata Sandi</label>
          <NuxtLink to="/forgot-password" class="forgot-link">Lupa Kata Sandi?</NuxtLink>
        </div>
        <div class="input-wrap">
          <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Masukkan kata sandi (Minimal 6 karakter)"
            class="form-input has-toggle"
            :disabled="authStore.loading"
          />
          <button
            type="button"
            class="toggle-pwd-btn"
            @click="showPassword = !showPassword"
            tabindex="-1"
            title="Lihat kata sandi"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="auth-submit-btn" :disabled="authStore.loading || !form.email || !form.password">
        <span v-if="authStore.loading" class="spinner"></span>
        <span>{{ authStore.loading ? 'Memuat...' : 'Masuk Sekarang' }}</span>
      </button>
    </form>

    <!-- OAuth Buttons -->
    <div class="oauth-divider"><span>atau masuk dengan</span></div>
    <div class="oauth-group">
      <button type="button" class="oauth-btn oauth-google" @click="handleOAuth('google')" :disabled="authStore.loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        <span>Masuk dengan Google</span>
      </button>
      <button type="button" class="oauth-btn oauth-github" @click="handleOAuth('github')" :disabled="authStore.loading">
        <svg class="github-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        <span>Masuk dengan GitHub</span>
      </button>
    </div>

    <!-- Switch to Register -->
    <div class="auth-card-footer">
      <p>Belum punya akun? <NuxtLink to="/register" class="auth-link">Daftar Akun Baru</NuxtLink></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import type { LoginCredentials } from '~/types/auth'

definePageMeta({
  title: 'Login',
  layout: 'auth'
})

const route = useRoute()
const authStore = useAuthStore()

const resetSuccess = ref<boolean>(false)
const registeredSuccess = ref<boolean>(false)
const verifyRequired = ref<boolean>(false)

const form = reactive<LoginCredentials>({
  email: '',
  password: ''
})

const showPassword = ref<boolean>(false)

onMounted(() => {
  authStore.clearMessages()
  if (route.query.reset === 'success') {
    resetSuccess.value = true
  }
  if (route.query.registered === 'success') {
    registeredSuccess.value = true
  }
  if (route.query.registered === 'verify') {
    verifyRequired.value = true
  }
  // Jika kembali dari OAuth dan sudah login, arahkan ke dashboard
  if (import.meta.client) {
    const supabase = useSupabaseClient()
    const url = new URL(window.location.href)
    if (url.searchParams.has('code') || url.searchParams.has('access_token') || url.searchParams.has('refresh_token') || url.hash.includes('access_token')) {
      url.search = ''
      history.replaceState(null, '', url.pathname)
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigateTo('/dashboard', { replace: true })
      }
    }).catch(() => {})
  }
})

const handleLogin = async () => {
  if (!form.email || !form.password) return
  const success = await authStore.signIn(form)
  if (success) {
    try {
      await navigateTo('/dashboard', { replace: true })
    } catch {
      if (import.meta.client) {
        window.location.href = '/dashboard'
      }
    }
  }
}

const handleOAuth = async (provider: 'google' | 'github') => {
  await authStore.signInWithOAuth(provider)
}
</script>

<style scoped>
.auth-card {
  background: var(--card-bg, #0f1626);
  border: 1px solid var(--border-color, #1e293b);
  border-radius: 12px;
  padding: 34px 28px;
  box-shadow: var(--shadow-md, 0 1px 3px rgba(0, 0, 0, 0.4));
  transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-card-header {
  margin-bottom: 24px;
  text-align: center;
}

.auth-card-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-heading, #f8fafc);
  margin: 0;
  letter-spacing: -0.02em;
}

.auth-card-desc {
  font-size: 13.5px;
  color: var(--text-secondary, #94a3b8);
  margin-top: 6px;
  margin-bottom: 0;
  line-height: 1.5;
}

/* Alert */
.auth-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 20px;
}

.auth-alert.error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.22);
  color: #fca5a5;
}

.auth-alert.success {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.22);
  color: #86efac;
}

.auth-alert.info {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.22);
  color: #c7d2fe;
}

.auth-alert svg {
  flex-shrink: 0;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-soft, #cbd5e1);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: 12px;
  color: #818cf8;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.forgot-link:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary, #94a3b8);
  pointer-events: none;
}

.form-input {
  width: 100%;
  background: var(--input-bg, #090d16);
  border: 1px solid var(--input-border, #1e293b);
  border-radius: 8px;
  padding: 10px 14px 10px 38px;
  color: var(--input-color, #f8fafc);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease, color 0.15s ease;
  font-family: inherit;
}

.form-input.has-toggle {
  padding-right: 40px;
}

.form-input:focus {
  border-color: var(--border-focus, #005afb);
  box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.18);
}

.form-input::placeholder {
  color: var(--input-placeholder, #94a3b8);
}

.form-input:-webkit-autofill,
.form-input:-webkit-autofill:hover,
.form-input:-webkit-autofill:focus,
.form-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px var(--input-bg, #090d16) inset !important;
  box-shadow: 0 0 0 1000px var(--input-bg, #090d16) inset !important;
  -webkit-text-fill-color: var(--input-color, #f8fafc) !important;
  caret-color: var(--input-color, #f8fafc) !important;
  transition: background-color 5000s ease-in-out 0s;
}

.toggle-pwd-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.15s ease;
}

.toggle-pwd-btn:hover {
  color: var(--text-primary, #f8fafc);
}

/* Submit Button */
.auth-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 16px;
  background: var(--accent-primary, #005afb);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  margin-top: 6px;
  font-family: inherit;
}

.auth-submit-btn:hover:not(:disabled) {
  background: var(--accent-primary-hover, #004ecc);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}

.auth-submit-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.auth-submit-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.35);
}

.auth-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Footer */
.auth-card-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13.5px;
  color: #94a3b8;
  border-top: 1px solid #1e293b;
  padding-top: 18px;
}

.oauth-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 20px 0 14px;
  font-size: 12.5px;
  color: var(--text-secondary, #94a3b8);
}
.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color, #1e293b);
}

.oauth-group {
  display: flex;
  gap: 10px;
}

.oauth-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  background: var(--bg-surface, #0f172a);
  border: 1px solid var(--border-color, #1f2a3f);
  color: var(--text-primary, #f1f5f9);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}

.oauth-btn:hover:not(:disabled) {
  background: var(--bg-hover, #172136);
  border-color: var(--border-subtle, #2d3b55);
}

.oauth-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.oauth-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.18);
}

.oauth-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.oauth-btn svg {
  flex-shrink: 0;
}

:global(html.light) .oauth-btn {
  background: #ffffff;
  border: 1px solid #d0d7e2;
  color: #0f172a;
  box-shadow: 0 1px 1px rgba(15, 23, 42, 0.02);
}

:global(html.light) .oauth-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

:global(html.light) .oauth-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.oauth-github .github-icon {
  color: var(--text-primary, #f1f5f9);
}

:global(html.light) .oauth-github .github-icon {
  color: #0f172a;
}

.auth-card-footer p {
  margin: 0;
}

.auth-link {
  color: #818cf8;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
}

.auth-link:hover {
  color: #a5b4fc;
  text-decoration: underline;
}
</style>
