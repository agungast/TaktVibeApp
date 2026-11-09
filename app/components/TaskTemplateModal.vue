<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="taskStore.showTemplateModal"
        class="modal-backdrop"
        @click.self="taskStore.closeTemplateModal"
        role="dialog"
        aria-modal="true"
        :aria-label="taskStore.templates.length > 0 ? 'Pilih template tugas' : 'Template tugas'"
      >
        <div class="modal-card modal-card-wide">
          <!-- Icon Banner -->
          <div class="modal-icon-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
              <line x1="9" y1="9" x2="9" y2="21"></line>
            </svg>
          </div>

          <!-- Text Content -->
          <div class="modal-content">
            <h3 class="modal-title">Pilih Template Tugas</h3>
            <p class="modal-desc">
              Gunakan template yang sudah tersedia untuk mempercepat input tugas baru.
            </p>
          </div>

          <!-- Template List -->
          <div v-if="taskStore.templates.length > 0" class="template-list">            <button
              v-for="tpl in taskStore.templates"
              :key="tpl.id"
              type="button"
              class="template-item"
              :disabled="isUsingTemplate"
              @click="handleUseTemplate(tpl)"
            >
              <span class="template-icon">📋</span>
              <span class="template-info">
                <span class="template-name">{{ tpl.name }}</span>
                <span class="template-title">{{ tpl.title_template }}</span>
                <span class="template-meta">
                  <span class="template-priority">{{ priorityLabel(tpl.priority) }}</span>
                  <span v-if="tpl.estimated_hours">· {{ tpl.estimated_hours }} jam</span>
                </span>
              </span>
              <span class="template-cta">Pakai</span>
            </button>
          </div>

          <p v-else class="empty-inline">Belum ada template tersedia. Buat tugas dari kalimat bebas melalui input cepat di dashboard.</p>

          <!-- Actions -->
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="close">Batal</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import { useToastStore } from '~/stores/toastStore'

const taskStore = useTaskStore()
const toast = useToastStore()

const isUsingTemplate = ref<boolean>(false)

const priorityLabel = (p?: string): string => {
  switch (p) {
    case 'LOW': return 'Rendah'
    case 'HIGH': return 'Tinggi'
    case 'URGENT': return 'Mendesak'
    default: return 'Sedang'
  }
}

const close = (): void => {
  taskStore.closeTemplateModal()
}

const handleUseTemplate = async (tpl: any): Promise<void> => {
  isUsingTemplate.value = true
  const saved = await taskStore.createTaskFromTemplate(tpl)
  isUsingTemplate.value = false
  if (saved) {
    taskStore.closeTemplateModal()
  } else {
    toast.error('Gagal membuat tugas dari template.')
  }
}

// Tutup modal jika tombol ESC ditekan
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    taskStore.closeTemplateModal?.()
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
  background: var(--modal-backdrop-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Card */
.modal-card {
  background: var(--modal-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 28px 24px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-elevated);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.modal-card-wide {
  max-width: 440px;
}

/* Icon */
.modal-icon-circle {
  width: 52px;
  height: 52px;
  background: rgba(0, 90, 251, 0.12);
  border: 1px solid rgba(0, 90, 251, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  margin-bottom: 16px;
}

/* Content */
.modal-content {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-heading);
  margin: 0;
  letter-spacing: -0.02em;
}

.modal-desc {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Template List */
.template-list {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding-right: 4px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  font-family: inherit;
}

.template-item:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-subtle);
}

.template-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.template-icon {
  font-size: 18px;
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.template-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.template-title {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.template-priority {
  font-weight: 600;
  color: var(--text-soft);
}

.template-cta {
  flex-shrink: 0;
  padding: 6px 12px;
  background: var(--accent-primary);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
}

.template-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.35);
}

/* Empty inline */
.empty-inline {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}

/* Actions (1 Button) */
.modal-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.btn-cancel {
  flex: 1;
  padding: 10px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-soft);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  font-family: inherit;
}

.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-cancel:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.35);
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
