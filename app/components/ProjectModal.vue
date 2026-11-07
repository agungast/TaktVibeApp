<template>
  <Teleport to="body">
    <Transition name="project-modal">
      <div
        v-if="taskStore.showProjectModal"
        class="project-modal-backdrop"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
        id="project-modal-root"
      >
        <div class="project-modal-box">
          <!-- Top Header -->
          <div class="project-modal-header">
            <div class="header-title-wrap">
              <span class="header-icon">{{ formIcon }}</span>
              <h3 class="header-title">{{ isEdit ? 'Edit Ruang Kerja' : 'Ruang Kerja Baru' }}</h3>
            </div>
            <button
              type="button"
              class="close-btn"
              @click="handleClose"
              title="Tutup (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Form Body -->
          <form @submit.prevent="handleSubmit" class="project-modal-form">
            <!-- Project Name -->
            <div class="form-group">
              <label for="project-name-input" class="form-label">
                Nama Ruang Kerja <span class="req-star">*</span>
              </label>
              <input
                id="project-name-input"
                ref="nameInputRef"
                v-model="formName"
                type="text"
                class="form-input"
                placeholder="misal: Mobile App, Client Alpha, Personal..."
                required
                maxlength="50"
              />
            </div>

            <!-- Icon Picker -->
            <div class="form-group">
              <label class="form-label">Ikon Ruang Kerja</label>
              <div class="icon-picker-grid">
                <button
                  v-for="ic in presetIcons"
                  :key="ic"
                  type="button"
                  class="icon-choice-btn"
                  :class="{ active: formIcon === ic }"
                  @click="formIcon = ic"
                >
                  {{ ic }}
                </button>
              </div>
            </div>

            <!-- Color Picker -->
            <div class="form-group">
              <label class="form-label">Warna Aksen</label>
              <div class="color-picker-grid">
                <button
                  v-for="c in presetColors"
                  :key="c.hex"
                  type="button"
                  class="color-choice-btn"
                  :class="{ active: formColor === c.hex }"
                  :title="c.name"
                  @click="formColor = c.hex"
                >
                  <span class="color-dot" :style="{ background: c.hex }"></span>
                  <span class="color-name">{{ c.name }}</span>
                </button>
              </div>
            </div>

            <!-- Preview Card -->
            <div class="preview-box">
              <span class="preview-label">Pratinjau Badge:</span>
              <div
                class="preview-badge"
                :style="{
                  borderColor: formColor,
                  color: formColor,
                  background: `${formColor}14`
                }"
              >
                <span class="badge-icon">{{ formIcon }}</span>
                <span class="badge-text">{{ formName.trim() || 'Nama Ruang Kerja' }}</span>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="project-modal-footer">
              <button
                type="button"
                class="btn-cancel"
                @click="handleClose"
                :disabled="isSubmitting"
              >
                Batal
              </button>
              <button
                type="submit"
                class="btn-submit"
                :disabled="!formName.trim() || isSubmitting"
              >
                <span v-if="isSubmitting" class="submitting-spinner"></span>
                <span>{{ isEdit ? 'Simpan Perubahan' : 'Buat Ruang Kerja' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import type { Project } from '~/types/task'

const taskStore = useTaskStore()

const presetIcons = ['📁', '🚀', '💻', '🎨', '📝', '⚡', '🛒', '🎯', '📊', '🔧', '⭐', '💡']

const presetColors = [
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Slate', hex: '#94a3b8' }
]

const formName = ref<string>('')
const formIcon = ref<string>('📁')
const formColor = ref<string>('#38bdf8')
const isSubmitting = ref<boolean>(false)
const nameInputRef = ref<HTMLInputElement | null>(null)

const isEdit = computed<boolean>(() => !!taskStore.selectedProjectForEdit)

// Synchronize form when modal opens
watch(
  () => taskStore.showProjectModal,
  (open) => {
    if (open) {
      if (taskStore.selectedProjectForEdit) {
        formName.value = taskStore.selectedProjectForEdit.name
        formIcon.value = taskStore.selectedProjectForEdit.icon || '📁'
        formColor.value = taskStore.selectedProjectForEdit.color || '#38bdf8'
      } else {
        formName.value = ''
        formIcon.value = '📁'
        formColor.value = '#38bdf8'
      }
      isSubmitting.value = false
      nextTick(() => {
        nameInputRef.value?.focus()
      })
    }
  }
)

function handleClose(): void {
  if (isSubmitting.value) return
  taskStore.closeProjectModal()
}

async function handleSubmit(): Promise<void> {
  const trimmed = formName.value.trim()
  if (!trimmed || isSubmitting.value) return

  isSubmitting.value = true
  try {
    if (isEdit.value && taskStore.selectedProjectForEdit) {
      await taskStore.updateProject(taskStore.selectedProjectForEdit.id, {
        name: trimmed,
        icon: formIcon.value,
        color: formColor.value
      })
    } else {
      await taskStore.createProject({
        name: trimmed,
        icon: formIcon.value,
        color: formColor.value
      })
    }
    taskStore.closeProjectModal()
  } catch (err) {
    console.error('Error submitting project form:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.project-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 13, 0.78);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.project-modal-box {
  background: #0d1322;
  border: 1px solid #1f2a3f;
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
}

/* ─── HEADER ─────────────────────────────────────────────────────────────── */
.project-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #172136;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
}

.header-title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 600;
  color: #f1f5f9;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}

.close-btn:hover {
  color: #f1f5f9;
  background: #172136;
}

/* ─── FORM ───────────────────────────────────────────────────────────────── */
.project-modal-form {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.req-star {
  color: #f87171;
}

.form-input {
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 9px 12px;
  color: #f1f5f9;
  font-size: 13.5px;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: #005afb;
}

/* ─── ICON PICKER ────────────────────────────────────────────────────────── */
.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.icon-choice-btn {
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  font-size: 16px;
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.icon-choice-btn:hover {
  background: #172136;
  border-color: #2d3b55;
}

.icon-choice-btn.active {
  background: #172136;
  border-color: #38bdf8;
}

/* ─── COLOR PICKER ───────────────────────────────────────────────────────── */
.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.color-choice-btn {
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.color-choice-btn:hover {
  background: #172136;
  border-color: #2d3b55;
}

.color-choice-btn.active {
  background: #172136;
  border-color: #38bdf8;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.color-name {
  font-size: 11.5px;
  color: #cbd5e1;
  white-space: nowrap;
}

/* ─── PREVIEW ────────────────────────────────────────────────────────────── */
.preview-box {
  background: #090d16;
  border: 1px solid #172136;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-label {
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 500;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 5px;
  border: 1px solid;
  max-width: 220px;
}

.badge-icon {
  font-size: 13px;
}

.badge-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
.project-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #1f2a3f;
  color: #94a3b8;
  border-radius: 6px;
  padding: 7px 14px;
  font-size: 12.5px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background 0.15s ease;
}

.btn-cancel:hover:not(:disabled) {
  color: #f1f5f9;
  background: #172136;
}

.btn-submit {
  background: #005afb;
  border: 1px solid #005afb;
  color: #ffffff;
  border-radius: 6px;
  padding: 7px 16px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-submit:hover:not(:disabled) {
  background: #004ecc;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submitting-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── TRANSITION ─────────────────────────────────────────────────────────── */
.project-modal-enter-active,
.project-modal-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-modal-enter-from,
.project-modal-leave-to {
  opacity: 0;
}

.project-modal-enter-active .project-modal-box,
.project-modal-leave-active .project-modal-box {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-modal-enter-from .project-modal-box {
  transform: scale(0.95) translateY(6px);
}

.project-modal-leave-to .project-modal-box {
  transform: scale(0.96);
}
</style>
