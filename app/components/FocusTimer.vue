<template>
  <Teleport to="body">
    <div v-if="focusStore.isOpen" class="focus-timer-container">
      <!-- ─── 1. DOCKED COMPACT PILL (MINIMIZED) ────────────────────────── -->
      <transition name="dock-fade">
        <aside
          v-if="focusStore.isMinimized"
          class="focus-docked-pill"
          aria-label="Timer Fokus Ringkas"
        >
          <div class="docked-status-dot" :class="{ running: focusStore.isRunning }"></div>
          
          <div class="docked-info" @click="focusStore.expandWidget" title="Klik untuk membuka layar penuh">
            <span class="docked-mode-label">
              {{ focusStore.timerMode === 'work' ? 'Fokus' : 'Istirahat' }}
            </span>
            <span class="docked-task-name" :title="focusStore.activeTask?.title">
              {{ focusStore.activeTask?.title || 'Sesi Mandiri' }}
            </span>
          </div>

          <div class="docked-time font-tabular">
            {{ focusStore.formattedTime }}
          </div>

          <div class="docked-actions">
            <button
              type="button"
              class="docked-btn primary"
              @click="focusStore.toggleTimer"
              :title="focusStore.isRunning ? 'Jeda' : 'Lanjutkan'"
              :aria-label="focusStore.isRunning ? 'Jeda' : 'Lanjutkan'"
            >
              <svg v-if="focusStore.isRunning" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>

            <button
              type="button"
              class="docked-btn secondary"
              @click="focusStore.expandWidget"
              title="Perbesar Tampilan"
              aria-label="Perbesar Tampilan"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
          </div>
        </aside>
      </transition>

      <!-- ─── 2. EXPANDED ZEN FOCUS MODAL ───────────────────────────────── -->
      <transition name="modal-pop">
        <div
          v-if="!focusStore.isMinimized"
          class="focus-modal-overlay"
          @click.self="focusStore.minimizeWidget"
        >
          <div class="focus-modal-card" role="dialog" aria-modal="true" aria-labelledby="focus-title">
            <!-- Modal Header -->
            <div class="modal-top">
              <div class="modal-tag">
                <span class="focus-pulse-dot" :class="{ active: focusStore.isRunning }"></span>
                <span class="focus-tag-text">TaktVibe Focus Mode</span>
              </div>
              <div class="modal-controls">
                <button
                  type="button"
                  class="icon-control-btn"
                  @click="focusStore.minimizeWidget"
                  title="Kecilkan ke pojok layar"
                  aria-label="Kecilkan ke pojok layar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="14" x2="10" y2="14"></line>
                    <line x1="10" y1="14" x2="10" y2="20"></line>
                    <polyline points="14 10 20 10 20 4"></polyline>
                    <line x1="14" y1="10" x2="20" y2="4"></line>
                  </svg>
                </button>
                <button
                  type="button"
                  class="icon-control-btn"
                  @click="focusStore.closeFocusWidget"
                  title="Tutup Sesi Fokus"
                  aria-label="Tutup Sesi Fokus"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Task Context Banner -->
            <div class="focus-task-banner">
              <div class="task-badge-row">
                <span
                  v-if="focusStore.activeTask?.project"
                  class="project-pill"
                  :style="{ color: focusStore.activeTask.project.color, borderColor: `${focusStore.activeTask.project.color}40`, background: `${focusStore.activeTask.project.color}15` }"
                >
                  {{ focusStore.activeTask.project.icon }} {{ focusStore.activeTask.project.name }}
                </span>
                <span class="priority-badge" :class="focusStore.activeTask?.priority?.toLowerCase() || 'medium'">
                  {{ focusStore.activeTask?.priority || 'MEDIUM' }}
                </span>
              </div>
              <h2 id="focus-title" class="task-focus-title">
                {{ focusStore.activeTask?.title || 'Sesi Fokus Mandiri' }}
              </h2>
            </div>

            <!-- Mode Selector Tabs -->
            <div class="mode-switcher-group" role="tablist">
              <button
                type="button"
                role="tab"
                class="mode-btn"
                :class="{ active: focusStore.timerMode === 'work' }"
                @click="focusStore.setMode('work')"
              >
                Fokus (25m)
              </button>
              <button
                type="button"
                role="tab"
                class="mode-btn"
                :class="{ active: focusStore.timerMode === 'short_break' }"
                @click="focusStore.setMode('short_break')"
              >
                Istirahat (5m)
              </button>
              <button
                type="button"
                role="tab"
                class="mode-btn"
                :class="{ active: focusStore.timerMode === 'long_break' }"
                @click="focusStore.setMode('long_break')"
              >
                Istirahat Panjang (15m)
              </button>
            </div>

            <!-- Digital Timer Display & Circular-like Track -->
            <div class="timer-display-box">
              <div class="timer-digits font-tabular">
                {{ focusStore.formattedTime }}
              </div>
              <div class="timer-progress-track">
                <div
                  class="timer-progress-bar"
                  :style="{ transform: `scaleX(${focusStore.progressPercent / 100})` }"
                ></div>
              </div>
              <p class="timer-sub-caption">
                {{ focusStore.isRunning ? 'Fokus aktif — hilangkan distraksi.' : 'Timer terjeda. Tekan mulai saat siap.' }}
              </p>
            </div>

            <!-- Primary Action Controls -->
            <div class="timer-action-row">
              <button
                type="button"
                class="btn-reset"
                @click="focusStore.resetTimer"
                title="Reset Waktu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                <span>Reset</span>
              </button>

              <button
                type="button"
                class="btn-play-pause"
                :class="{ running: focusStore.isRunning }"
                @click="focusStore.toggleTimer"
              >
                <svg v-if="focusStore.isRunning" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>{{ focusStore.isRunning ? 'Jeda Fokus' : 'Mulai Fokus' }}</span>
              </button>

              <button
                type="button"
                class="btn-minimize-text"
                @click="focusStore.minimizeWidget"
                title="Kecilkan ke pojok layar"
              >
                <span>Kecilkan</span>
              </button>
            </div>

            <!-- Session Tracker Footer -->
            <div class="modal-footer-stats">
              <span class="session-badge">
                Sesi Tuntas: <strong>{{ focusStore.sessionsCompleted }}</strong>
              </span>
              <span v-if="focusStore.activeTask?.actual_hours" class="logged-hours">
                Total Tercatat: <strong>{{ focusStore.activeTask.actual_hours }}h</strong>
              </span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useFocusStore } from '~/stores/focusStore'

const focusStore = useFocusStore()
</script>

<style scoped>
/* ─── DOCKED PILL (COMPACT BOTTOM-RIGHT) ─────────────────────────────────── */
.focus-docked-pill {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  box-shadow: var(--shadow-elevated);
  font-family: 'Outfit', sans-serif;
  color: var(--text-primary);
}

.docked-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-muted);
  transition: background-color 200ms ease;
}

.docked-status-dot.running {
  background-color: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}

.docked-info {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  max-width: 160px;
}

.docked-mode-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  font-weight: 600;
}

.docked-task-name {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.docked-time {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
}

.docked-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.docked-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 150ms ease, transform 150ms ease;
}

.docked-btn.primary {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
}

.docked-btn.primary:hover {
  filter: brightness(1.1);
  transform: scale(1.04);
}

.docked-btn.secondary {
  background-color: var(--bg-hover);
  color: var(--text-secondary);
}

.docked-btn.secondary:hover {
  color: var(--text-primary);
  background-color: var(--bg-active);
}

/* ─── EXPANDED MODAL ─────────────────────────────────────────────────────── */
.focus-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: var(--modal-backdrop-bg);
  backdrop-filter: blur(6px);
}

.focus-modal-card {
  width: 100%;
  max-width: 480px;
  background-color: var(--modal-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-elevated);
  font-family: 'Outfit', sans-serif;
  color: var(--text-primary);
}

.modal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.focus-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-muted);
}

.focus-pulse-dot.active {
  background-color: var(--color-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}

.modal-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-control-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}

.icon-control-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* Task Banner */
.focus-task-banner {
  text-align: center;
  margin-bottom: 24px;
  padding: 0 8px;
}

.task-badge-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.project-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 9999px;
  border: 1px solid;
}

.priority-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
}

.priority-badge.low { background-color: rgba(148, 163, 184, 0.15); color: var(--text-soft); }
.priority-badge.medium { background-color: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.priority-badge.high { background-color: rgba(245, 158, 11, 0.15); color: var(--color-warning); }
.priority-badge.urgent { background-color: rgba(239, 68, 68, 0.15); color: var(--color-danger); }

.task-focus-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text-primary);
  margin: 0;
}

/* Mode Switcher Tabs */
.mode-switcher-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: var(--bg-elevated);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.mode-btn {
  flex: 1;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.mode-btn.active {
  background-color: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Digital Timer Box */
.timer-display-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
}

.timer-digits {
  font-size: 64px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.font-tabular {
  font-variant-numeric: tabular-nums;
}

.timer-progress-track {
  width: 100%;
  height: 6px;
  background-color: var(--bg-active);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 10px;
}

.timer-progress-bar {
  height: 100%;
  width: 100%;
  background-color: var(--accent-primary);
  transform-origin: left;
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}

.timer-sub-caption {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* Action Controls */
.timer-action-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-play-pause {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  background-color: var(--accent-primary);
  color: #ffffff;
  font-weight: 700;
  font-size: 15px;
  border: 1px solid var(--accent-primary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-play-pause:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.btn-play-pause.running {
  background-color: var(--bg-elevated);
  border-color: var(--border-subtle);
  color: var(--text-primary);
}

.btn-reset, .btn-minimize-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background-color: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-reset:hover, .btn-minimize-text:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* Footer Stats */
.modal-footer-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* ─── TRANSITIONS (Anti-Bounce Exponential Ease-Out) ─────────────────────── */
.dock-fade-enter-active, .dock-fade-leave-active {
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dock-fade-enter-from, .dock-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.modal-pop-enter-active, .modal-pop-leave-active {
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-pop-enter-from, .modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
