<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="authStore.showLogoutModal"
        class="modal-backdrop"
        @click.self="authStore.closeLogoutModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        <div class="modal-card">
          <!-- Icon Banner -->
          <div class="modal-icon-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>

          <!-- Text Content -->
          <div class="modal-content">
            <h3 id="logout-modal-title" class="modal-title">Konfirmasi Keluar</h3>
            <p class="modal-desc">
              Apakah Anda yakin ingin keluar dari sesi akun
              <strong class="user-highlight">{{ authStore.displayName }}</strong>?
            </p>
          </div>

          <!-- Actions (2 Buttons) -->
          <div class="modal-actions">
            <button
              type="button"
              class="btn-cancel"
              @click="authStore.closeLogoutModal"
              :disabled="authStore.loading"
            >
              Batal
            </button>
            <button
              type="button"
              class="btn-confirm-logout"
              @click="handleConfirmLogout"
              :disabled="authStore.loading"
            >
              <span v-if="authStore.loading" class="spinner"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>{{ authStore.loading ? 'Sedang Keluar...' : 'Ya, Keluar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

const authStore = useAuthStore()

const handleConfirmLogout = async () => {
  await authStore.signOut()
  authStore.closeLogoutModal()
}

// Tutup modal jika tombol ESC ditekan
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && authStore.showLogoutModal) {
    authStore.closeLogoutModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Card */
.modal-card {
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 14px;
  padding: 28px 24px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* Icon */
.modal-icon-circle {
  width: 52px;
  height: 52px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f87171;
  margin-bottom: 16px;
}

/* Content */
.modal-content {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: -0.02em;
}

.modal-desc {
  font-size: 13.5px;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.5;
}

.user-highlight {
  color: #f8fafc;
  font-weight: 600;
}

/* Actions (2 Buttons) */
.modal-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.btn-cancel {
  flex: 1;
  padding: 10px 16px;
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-cancel:hover:not(:disabled) {
  background: #172136;
  color: #ffffff;
}

.btn-confirm-logout {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #ef4444;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.btn-confirm-logout:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.btn-confirm-logout:disabled, .btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Transition Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  opacity: 0;
  transform: scale(0.92) translateY(6px);
}
</style>
