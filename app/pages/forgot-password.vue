<template>
  <div class="ldg-card">
    <div class="ldg-header">
      <h1 class="ldg-title">Lupa kata sandi</h1>
      <p class="ldg-desc">Masukkan email terdaftar untuk menerima tautan reset.</p>
    </div>

    <!-- Alert Error / Success -->
    <div v-if="authStore.authError" class="ldg-alert error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ authStore.authError }}</span>
    </div>

    <div v-if="authStore.successMessage" class="ldg-alert success">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>{{ authStore.successMessage }}</span>
    </div>

    <!-- Forgot Password Form -->
    <form @submit.prevent="handleSubmit" class="ldg-form">
      <div class="ldg-group">
        <label class="ldg-label" for="forgot-email">Email</label>
        <div class="ldg-input-wrap">
          <svg class="ldg-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input
            id="forgot-email"
            v-model="email"
            type="email"
            required
            placeholder="Masukkan email terdaftar"
            class="ldg-input"
            :disabled="authStore.loading"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="ldg-submit" :disabled="authStore.loading || !email">
        <span v-if="authStore.loading" class="ldg-spinner"></span>
        <span>{{ authStore.loading ? 'Mengirim...' : 'Kirim tautan reset' }}</span>
      </button>
    </form>

    <!-- Back to Login Link -->
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
  title: 'Lupa Kata Sandi',
  layout: 'auth'
})

const authStore = useAuthStore()
const email = ref<string>('')

onMounted(() => {
  authStore.clearMessages()
})

const handleSubmit = async () => {
  if (!email.value) return
  await authStore.sendPasswordReset(email.value.trim())
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

.ldg-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, var(--bg-active));
}

.ldg-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
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
