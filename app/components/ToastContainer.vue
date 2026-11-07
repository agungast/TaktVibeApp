<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-label="Notifikasi">
      <TransitionGroup name="toast-slide" tag="div" class="toast-stack">
        <div
          v-for="toast in (toastStore?.toasts || [])"
          :key="toast.id"
          class="toast-card"
          :class="`toast-${toast.type}`"
          role="alert"
        >
          <!-- Semantic Icon -->
          <div class="toast-icon-wrap" :class="`icon-${toast.type}`">
            <!-- Success Icon -->
            <svg
              v-if="toast.type === 'success'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>

            <!-- Error Icon -->
            <svg
              v-else-if="toast.type === 'error'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>

            <!-- Warning Icon -->
            <svg
              v-else-if="toast.type === 'warning'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>

            <!-- Info Icon -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>

          <!-- Content: Title & Message -->
          <div class="toast-body">
            <h5 v-if="toast.title" class="toast-title">
              {{ toast.title }}
            </h5>
            <p class="toast-message">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            class="toast-close-btn"
            @click="toastStore.removeToast(toast.id)"
            title="Tutup Notifikasi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Countdown Progress Line -->
          <div
            v-if="(toast.duration || 0) > 0"
            class="toast-progress-bar"
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toastStore'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  width: 100%;
  max-width: 360px;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.toast-card {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: #111726;
  border: 1px solid #1f2a3f;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

/* Subtle Semantic Tints (Without neon glow) */
.toast-card.toast-success {
  border-color: rgba(16, 185, 129, 0.35);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.07) 0%, #111726 60%);
}

.toast-card.toast-error {
  border-color: rgba(239, 68, 68, 0.35);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.07) 0%, #111726 60%);
}

.toast-card.toast-warning {
  border-color: rgba(245, 158, 11, 0.35);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.07) 0%, #111726 60%);
}

.toast-card.toast-info {
  border-color: rgba(59, 130, 246, 0.35);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.07) 0%, #111726 60%);
}

/* Icons */
.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-top: 1px;
}

.toast-icon-wrap.icon-success {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.toast-icon-wrap.icon-error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.toast-icon-wrap.icon-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.toast-icon-wrap.icon-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

/* Body */
.toast-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.toast-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  line-height: 1.35;
}

.toast-message {
  font-size: 12px;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

/* Close Button */
.toast-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 3px;
  margin-top: -2px;
  margin-right: -4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s ease, background 0.15s ease;
}

.toast-close-btn:hover {
  color: #ffffff;
  background: #172136;
}

/* Progress Countdown Line */
.toast-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: currentColor;
  transform-origin: left;
  animation-name: toastTimer;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  opacity: 0.35;
}

.toast-success .toast-progress-bar { color: #10b981; }
.toast-error .toast-progress-bar { color: #ef4444; }
.toast-warning .toast-progress-bar { color: #f59e0b; }
.toast-info .toast-progress-bar { color: #3b82f6; }

@keyframes toastTimer {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Transition Animations (GPU Composite only) */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.toast-slide-enter-from {
  transform: translateX(40px);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateX(40px);
  opacity: 0;
}

@media (max-width: 640px) {
  .toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
    max-width: none;
  }
}
</style>
