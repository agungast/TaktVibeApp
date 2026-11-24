<template>
  <div class="ldg-card">
    <div class="ldg-header">
      <h1 class="ldg-title">Daftar akun</h1>
      <p class="ldg-desc">Buat akun untuk mulai mengelola tugas Anda.</p>
    </div>

    <!-- Alert Error / Success -->
    <div v-if="localError || authStore.authError" class="ldg-alert error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ localError || authStore.authError }}</span>
    </div>

    <div v-if="authStore.successMessage" class="ldg-alert success">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{{ authStore.successMessage }}</span>
    </div>

    <!-- Register Form -->
    <form @submit.prevent="handleRegister" class="ldg-form">
      <!-- Nama Lengkap -->
      <div class="ldg-group">
        <label class="ldg-label" for="reg-name">Nama lengkap</label>
        <div class="ldg-input-wrap">
          <svg class="ldg-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input
            id="reg-name"
            v-model="form.fullName"
            type="text"
            required
            placeholder="Masukkan nama lengkap"
            class="ldg-input"
            :disabled="authStore.loading"
          />
        </div>
      </div>

      <!-- Email -->
      <div class="ldg-group">
        <label class="ldg-label" for="reg-email">Email</label>
        <div class="ldg-input-wrap">
          <svg class="ldg-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input
            id="reg-email"
            v-model="form.email"
            type="email"
            required
            placeholder="nama@email.com"
            class="ldg-input"
            :disabled="authStore.loading"
          />
        </div>
      </div>

      <!-- Password -->
      <div class="ldg-group">
        <label class="ldg-label" for="reg-password">Kata sandi</label>
        <div class="ldg-input-wrap">
          <svg class="ldg-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input
            id="reg-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Minimal 6 karakter"
            minlength="6"
            class="ldg-input has-toggle"
            :disabled="authStore.loading"
          />
          <button
            type="button"
            class="ldg-toggle"
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

      <!-- Confirm Password -->
      <div class="ldg-group">
        <label class="ldg-label" for="reg-confirm-password">Konfirmasi kata sandi</label>
        <div class="ldg-input-wrap">
          <svg class="ldg-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <input
            id="reg-confirm-password"
            v-model="form.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Ulangi kata sandi"
            minlength="6"
            class="ldg-input"
            :disabled="authStore.loading"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="ldg-submit" :disabled="authStore.loading || !form.fullName?.trim() || !form.email || !form.password || !form.confirmPassword">
        <span v-if="authStore.loading" class="ldg-spinner"></span>
        <span>{{ authStore.loading ? 'Mendaftarkan...' : 'Daftar' }}</span>
      </button>
    </form>

    <!-- OAuth Buttons -->
    <div class="ldg-divider"><span>atau daftar dengan</span></div>
    <div class="ldg-oauth-group">
      <button type="button" class="ldg-oauth-btn" @click="handleOAuth('google')" :disabled="authStore.loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        <span>Daftar dengan Google</span>
      </button>
      <button type="button" class="ldg-oauth-btn" @click="handleOAuth('github')" :disabled="authStore.loading">
        <svg class="ldg-github-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        <span>Daftar dengan GitHub</span>
      </button>
    </div>

    <!-- Switch to Login -->
    <div class="ldg-footer">
      <p>Sudah punya akun? <NuxtLink to="/login" class="ldg-text-link">Masuk</NuxtLink></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import type { RegisterCredentials } from '~/types/auth'

definePageMeta({
  title: 'Sign Up',
  layout: 'auth'
})

const authStore = useAuthStore()

const form = reactive<RegisterCredentials>({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref<boolean>(false)
const localError = ref<string | null>(null)

onMounted(() => {
  authStore.clearMessages()
})

const handleOAuth = async (provider: 'google' | 'github') => {
  await authStore.signInWithOAuth(provider)
}

const handleRegister = async () => {
  localError.value = null

  if (!form.fullName || !form.fullName.trim()) {
    localError.value = 'Masukkan nama lengkap Anda.'
    return
  }

  if (form.password.length < 6) {
    localError.value = 'Kata sandi minimal 6 karakter.'
    return
  }

  if (form.password !== form.confirmPassword) {
    localError.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  await authStore.signUp({
    fullName: form.fullName.trim(),
    email: form.email,
    password: form.password
  })
}
</script>

<style scoped>
.ldg-card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, var(--bg-active));
  border-radius: 8px;
  padding: 24px;
  color: var(--text-primary, #111316);
  font-family: 'Outfit', sans-serif;
}

.ldg-header {
  margin-bottom: 24px;
}

.ldg-title {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--text-primary, #111316);
  margin: 0;
}

.ldg-desc {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary, var(--text-secondary));
  margin: 8px 0 0;
}

.ldg-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  margin-bottom: 20px;
  background: var(--bg-base, #f2f4f7);
  border: 1px solid var(--border-color, var(--bg-active));
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary, #111316);
}

.ldg-alert svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.ldg-alert.error svg {
  color: var(--color-danger, var(--color-danger));
}

.ldg-alert.success svg {
  color: var(--color-success, var(--color-success));
}

.ldg-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ldg-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ldg-label {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-secondary, var(--text-secondary));
}

.ldg-text-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #111316);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ldg-text-link:hover {
  text-decoration-thickness: 2px;
}

.ldg-text-link:focus-visible {
  outline: 2px solid var(--accent-primary, #141414);
  outline-offset: 2px;
  border-radius: 2px;
}

.ldg-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.ldg-input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary, var(--text-secondary));
  pointer-events: none;
}

.ldg-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px 0 38px;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--input-border, var(--bg-active));
  border-radius: 6px;
  color: var(--text-primary, #111316);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.ldg-input.has-toggle {
  padding-right: 40px;
}

.ldg-input:focus-visible {
  border-color: var(--accent-primary, #141414);
  outline: 2px solid var(--accent-primary, #141414);
  outline-offset: 1px;
}

.ldg-input::placeholder {
  color: var(--text-secondary, var(--text-secondary));
  opacity: 1;
}

.ldg-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ldg-toggle {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--text-secondary, var(--text-secondary));
  cursor: pointer;
}

.ldg-toggle:hover {
  background: var(--bg-base, #f2f4f7);
  color: var(--text-primary, #111316);
}

.ldg-toggle:focus-visible {
  outline: 2px solid var(--accent-primary, #141414);
  outline-offset: 1px;
}

.ldg-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  margin-top: 4px;
  padding: 0 16px;
  background: var(--accent-primary, #141414);
  border: 1px solid var(--accent-primary, #141414);
  border-radius: 6px;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.ldg-submit:hover:not(:disabled) {
  background: #000000;
  border-color: #000000;
}

.ldg-submit:focus-visible {
  outline: 2px solid var(--accent-primary, #141414);
  outline-offset: 2px;
}

.ldg-submit:disabled {
  background: var(--bg-active);
  border-color: var(--border-color);
  color: var(--text-secondary);
  opacity: 1;
  cursor: not-allowed;
}

.ldg-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: ldg-spin 0.8s linear infinite;
}

@keyframes ldg-spin {
  to { transform: rotate(360deg); }
}

.ldg-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 12px;
  font-size: 13px;
  color: var(--text-secondary, var(--text-secondary));
}

.ldg-divider::before,
.ldg-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color, var(--bg-active));
}

.ldg-oauth-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ldg-oauth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 8px;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, var(--bg-active));
  border-radius: 6px;
  color: var(--text-primary, #111316);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.ldg-oauth-btn:hover:not(:disabled) {
  background: var(--bg-base, #f2f4f7);
}

.ldg-oauth-btn:focus-visible {
  outline: 2px solid var(--accent-primary, #141414);
  outline-offset: 2px;
}

.ldg-oauth-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ldg-oauth-btn svg {
  flex-shrink: 0;
}

.ldg-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, var(--bg-active));
  font-size: 13px;
  color: var(--text-secondary, var(--text-secondary));
}

.ldg-footer p {
  margin: 0;
}
</style>
