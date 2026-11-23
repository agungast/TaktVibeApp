<template>
  <div class="ldg-card">
    <div class="ldg-header">
      <h2 class="ldg-title">Atur ulang kata sandi</h2>
      <p class="ldg-desc">Masukkan kata sandi baru untuk akun Anda.</p>
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
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{{ authStore.successMessage }}</span>
    </div>

    <!-- Reset Password Form -->
    <form @submit.prevent="handleResetPassword" class="ldg-form">
      <!-- Password Baru -->
      <div class="ldg-group">
        <label class="ldg-label" for="new-password">Kata sandi baru</label>
        <div class="ldg-input-wrap">
          <svg class="ldg-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

      <!-- Konfirmasi Password Baru -->
      <div class="ldg-group">
        <label class="ldg-label" for="confirm-new-password">Konfirmasi kata sandi baru</label>
        <div class="ldg-input-wrap">
          <svg class="ldg-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <input
            id="confirm-new-password"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Ulangi kata sandi baru"
            minlength="6"
            class="ldg-input"
            :disabled="authStore.loading"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="ldg-submit" :disabled="authStore.loading || !password || !confirmPassword">
        <span v-if="authStore.loading" class="ldg-spinner"></span>
        <span>{{ authStore.loading ? 'Menyimpan...' : 'Simpan kata sandi' }}</span>
      </button>
    </form>

    <!-- Switch to Login -->
    <div class="ldg-footer">
      <NuxtLink to="/login" class="ldg-back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Kembali ke masuk</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

definePageMeta({
  title: 'Reset Kata Sandi',
  layout: 'auth'
})

useHead({
  title: 'Reset Kata Sandi'
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
      localError.value = 'Sesi pemulihan tidak ditemukan. Buka halaman ini dari tautan di email Anda.'
    }
  }, 1200)
})

const handleResetPassword = async () => {
  localError.value = null

  if (password.value.length < 6) {
    localError.value = 'Kata sandi minimal 6 karakter.'
    return
  }

  if (password.value !== confirmPassword.value) {
    localError.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  await authStore.updatePassword(password.value)
}
</script>

<style scoped>
.ldg-card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e5e9);
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
  color: var(--text-secondary, #5f636b);
  margin: 8px 0 0;
}

.ldg-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  margin-bottom: 20px;
  background: var(--bg-base, #f2f4f7);
  border: 1px solid var(--border-color, #e2e5e9);
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
  color: var(--color-danger, #b42318);
}

.ldg-alert.success svg {
  color: var(--color-success, #157a3c);
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
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text-secondary, #5f636b);
}

.ldg-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.ldg-input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary, #5f636b);
  pointer-events: none;
}

.ldg-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px 0 38px;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--input-border, #e2e5e9);
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
  color: var(--text-secondary, #5f636b);
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
  color: var(--text-secondary, #5f636b);
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
  opacity: 0.5;
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

.ldg-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #e2e5e9);
}

.ldg-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary, #111316);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ldg-back-link:hover {
  text-decoration-thickness: 2px;
}

.ldg-back-link:focus-visible {
  outline: 2px solid var(--accent-primary, #141414);
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
