<template>
  <div class="error-page">
    <div class="error-card">
      <p class="error-code">{{ error?.statusCode || 500 }}</p>
      <h1 class="error-title">{{ title }}</h1>
      <p class="error-message">{{ message }}</p>
      <div class="error-actions">
        <button type="button" class="btn-primary" @click="handleError">Kembali ke Beranda</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const title = computed(() => props.error?.statusCode === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan')
const message = computed(() => {
  if (props.error?.statusCode === 404) return 'Halaman yang kamu cari tidak ada atau sudah dipindahkan.'
  return props.error?.statusMessage || 'Coba muat ulang halaman atau kembali ke beranda.'
})

const handleError = () => clearError({ redirect: '/' })
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.error-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  padding: 32px;
}
.error-code {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.error-title {
  margin: 0 0 8px;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-heading);
}
.error-message {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.error-actions { display: flex; gap: 8px; }
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-control);
  border: 1px solid #141414;
  background: #141414;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
}
.btn-primary:hover { background: #292929; border-color: #292929; }
.btn-primary:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(29,95,191,0.18); }
</style>
