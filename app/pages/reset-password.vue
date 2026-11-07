<template>
  <div class="auth-card">
    <div class="auth-card-header">
      <h2 class="auth-card-title">Atur Ulang Kata Sandi</h2>
      <p class="auth-card-desc">Masukkan kata sandi baru yang aman untuk akun Anda</p>
    </div>

    <!-- Alert Error / Success -->
    <div v-if="localError || authStore.authError" class="auth-alert error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ localError || authStore.authError }}</span>
    </div>

    <div v-if="authStore.successMessage" class="auth-alert success">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{{ authStore.successMessage }}</span>
    </div>

    <!-- Reset Password Form -->
    <form @submit.prevent="handleResetPassword" class="auth-form">
      <!-- Password Baru -->
      <div class="form-group">
        <label class="form-label" for="new-password">Kata Sandi Baru</label>
        <div class="input-wrap">
          <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <input
            id="new-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Minimal 6 karakter"
            minlength="6"
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

      <!-- Konfirmasi Password Baru -->
      <div class="form-group">
        <label class="form-label" for="confirm-new-password">Konfirmasi Kata Sandi Baru</label>
        <div class="input-wrap">
          <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <input
            id="confirm-new-password"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Ulangi kata sandi baru"
            minlength="6"
            class="form-input"
            :disabled="authStore.loading"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="auth-submit-btn" :disabled="authStore.loading || !password || !confirmPassword">
        <span v-if="authStore.loading" class="spinner"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ authStore.loading ? 'Memperbarui...' : 'Simpan Kata Sandi Baru' }}</span>
      </button>
    </form>

    <!-- Switch to Login -->
    <div class="auth-card-footer">
      <NuxtLink to="/login" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Kembali ke Halaman Masuk</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const authStore = useAuthStore()

const password = ref<string>('')
const confirmPassword = ref<string>('')
const showPassword = ref<boolean>(false)
const localError = ref<string | null>(null)
const hasValidSession = ref<boolean>(true)
const checkingSession = ref<boolean>(true)

onMounted(async () => {
  authStore.clearMessages()

  // 1. Tangani PKCE Flow jika ada query `code` di URL email
  const code = route.query.code as string
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error && data.session) {
        hasValidSession.value = true
        checkingSession.value = false
        return
      }
    } catch (err) {
      console.warn('PKCE exchange error:', err)
    }
  }

  // 2. Cek apakah ada session aktif / token dari recovery
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData?.session) {
    hasValidSession.value = true
    checkingSession.value = false
    return
  }

  // 3. Dengarkan event auth jika token hash (#access_token) sedang diproses
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
      hasValidSession.value = true
      checkingSession.value = false
    }
  })

  // Berikan waktu toleransi singkat untuk client memproses hash fragment
  setTimeout(() => {
    checkingSession.value = false
    if (!authStore.user && !hasValidSession.value) {
      localError.value = 'Sesi pemulihan tidak ditemukan. Pastikan Anda membuka halaman ini dengan mengklik tautan yang dikirimkan ke email Anda.'
    }
  }, 1200)
})

const handleResetPassword = async () => {
  localError.value = null

  if (password.value.length < 6) {
    localError.value = 'Kata sandi minimal harus terdiri dari 6 karakter.'
    return
  }

  if (password.value !== confirmPassword.value) {
    localError.value = 'Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.'
    return
  }

  await authStore.updatePassword(password.value)
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
  border-top: 1px solid #1e293b;
  padding-top: 18px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #818cf8;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
}

.back-link:hover {
  color: #a5b4fc;
}
</style>
