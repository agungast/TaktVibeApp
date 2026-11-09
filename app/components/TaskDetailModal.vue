<template>
  <Teleport to="body">
    <Transition name="detail-modal">
      <div
        v-if="taskStore.showDetailModal && activeTask"
        class="modal-backdrop"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
        id="task-detail-modal-root"
      >
        <div class="modal-box-detail">
          <!-- ─── TOP BAR: BREADCRUMB & CLOSE ─────────────────────────────── -->
          <div class="detail-topbar">
            <div class="topbar-left">
              <span class="detail-badge-id">#{{ activeTask.id.slice(0, 8) }}</span>
              <span class="detail-meta-sep">/</span>
              <span class="detail-meta-status" :class="`status-${(activeTask.status || 'TODO').toLowerCase()}`">
                {{ statusLabel }}
              </span>
            </div>
            <div class="topbar-right">
              <button
                type="button"
                class="btn-start-focus-top"
                @click="startFocusFromModal"
                title="Mulai Sesi Fokus Pomodoro untuk tugas ini"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Mulai Fokus</span>
              </button>

              <button
                type="button"
                class="detail-close-btn"
                @click="handleClose"
                title="Tutup Modal (Esc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- ─── TITLE & QUICK ATTRIBUTES ──────────────────────────────────── -->
          <div class="detail-header-section">
            <input
              v-model="localTitle"
              type="text"
              class="detail-title-input"
              placeholder="Nama tugas..."
              @blur="saveTitleChange"
              @keydown.enter.prevent="saveTitleChange"
            />

            <!-- Attribute Pills Row -->
            <div class="detail-attrs-grid">
              <!-- Prioritas -->
              <div class="attr-item span-2">
                <span class="attr-label">Prioritas</span>
                <div class="priority-selector-inline">
                  <button
                    v-for="p in priorityOptions"
                    :key="p.value"
                    type="button"
                    class="attr-p-btn"
                    :class="[p.dotClass, { active: (activeTask.priority || 'MEDIUM') === p.value }]"
                    @click="updatePriority(p.value)"
                  >
                    <span class="p-dot"></span>
                    <span>{{ p.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Ruang Kerja (Project Space) -->
              <div class="attr-item">
                <span class="attr-label">Ruang Kerja</span>
                <select
                  :value="activeTask.project_id || ''"
                  class="attr-select"
                  @change="onProjectChange($event)"
                >
                  <option value="">Tanpa Space</option>
                  <option v-for="proj in taskStore.projects" :key="proj.id" :value="proj.id">
                    {{ proj.icon }} {{ proj.name }}
                  </option>
                </select>
              </div>

              <!-- Status Alur -->
              <div class="attr-item">
                <span class="attr-label">Status Alur</span>
                <select
                  :value="activeTask.status || 'TODO'"
                  class="attr-select"
                  @change="onStatusChange($event)"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <!-- Tenggat Waktu -->
              <div class="attr-item">
                <span class="attr-label">Batas Waktu</span>
                <DatePicker
                  :model-value="dueDateInputVal"
                  @change="onDueDateChange($event)"
                />
              </div>

              <!-- Estimasi Jam -->
              <div class="attr-item">
                <span class="attr-label">Estimasi Jam</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  class="attr-input-num"
                  :value="activeTask.estimated_hours || ''"
                  placeholder="0.0"
                  @change="onEstimatedHoursChange($event)"
                />
              </div>

              <!-- Jam Kerja Aktual -->
              <div class="attr-item">
                <span class="attr-label">Jam Aktual</span>
                <div class="actual-hours-display">
                  <span class="hours-val">{{ Number(activeTask.actual_hours || 0).toFixed(1) }} jam</span>
                  <button
                    type="button"
                    class="quick-focus-icon-btn"
                    @click="startFocusFromModal"
                    title="Mulai Fokus Pomodoro"
                  >
                    ▶ Fokus
                  </button>
                </div>
              </div>
            </div>

            <!-- Tags Row -->
            <div v-if="taskTags.length > 0" class="detail-tags-row">
              <span v-for="tag in taskTags" :key="tag" class="detail-tag-chip">#{{ tag }}</span>
            </div>
          </div>

          <div class="detail-divider"></div>

          <!-- ─── SUBTASKS / CHECKLIST SECTION ──────────────────────────────── -->
          <section class="detail-section subtasks-section">
            <div class="section-header">
              <div class="section-title-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <h3 class="section-title">Daftar Sub-Tugas</h3>
              </div>
              <div class="section-actions-wrap">
                <button
                  type="button"
                  class="ai-breakdown-btn"
                  :disabled="isGeneratingAi"
                  @click="triggerAiBreakdown"
                  title="Pecah tugas menjadi checklist otomatis dengan AI"
                >
                  <svg v-if="isGeneratingAi" class="spin-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <span>{{ isGeneratingAi ? 'Menganalisis...' : 'Pecah dengan AI' }}</span>
                </button>
                <span class="subtask-ratio-badge">
                  {{ completedSubtasksCount }} / {{ totalSubtasksCount }} Selesai ({{ subtaskProgressPercent }}%)
                </span>
              </div>
            </div>

            <!-- AI Breakdown Suggestion Card -->
            <div v-if="aiSuggestedSubtasks.length > 0" class="ai-suggestion-card">
              <div class="ai-card-header">
                <div class="ai-header-left">
                  <span class="ai-sparkle">✨</span>
                  <span class="ai-card-title">Rekomendasi Subtask dari AI</span>
                </div>
                <button type="button" class="ai-close-preview" @click="cancelAiSubtasks" title="Tutup Rekomendasi">&times;</button>
              </div>
              <p v-if="aiNotice" class="ai-card-notice">{{ aiNotice }}</p>
              <p class="ai-card-desc">Pilih subtask yang ingin langsung ditambahkan:</p>
              <div class="ai-items-list">
                <label
                  v-for="(item, idx) in aiSuggestedSubtasks"
                  :key="idx"
                  class="ai-item-check"
                >
                  <input type="checkbox" v-model="item.selected" class="ai-checkbox" />
                  <input
                    type="text"
                    v-model="item.text"
                    class="ai-item-input"
                    placeholder="Ubah judul subtask jika perlu..."
                  />
                </label>
              </div>
              <div class="ai-card-actions">
                <button
                  type="button"
                  class="btn-apply-ai"
                  :disabled="!hasSelectedAiSubtasks"
                  @click="applyAiSubtasks"
                >
                  Tambahkan ke Subtask ({{ selectedAiCount }})
                </button>
                <button
                  type="button"
                  class="btn-cancel-ai"
                  @click="cancelAiSubtasks"
                >
                  Batal
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="totalSubtasksCount > 0" class="subtask-progress-track">
              <div
                class="subtask-progress-fill"
                :style="{ transform: `scaleX(${subtaskProgressPercent / 100})` }"
              ></div>
            </div>

            <!-- Subtask List Items -->
            <div class="subtasks-list">
              <div
                v-for="st in subtasksList"
                :key="st.id"
                class="subtask-item"
                :class="{ 'is-completed': st.is_completed }"
              >
                <label class="subtask-check-label">
                  <input
                    type="checkbox"
                    class="subtask-checkbox"
                    :checked="st.is_completed"
                    @change="handleToggleSubtask(st)"
                  />
                  <span class="subtask-custom-box">
                    <svg v-if="st.is_completed" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span class="subtask-title-text">{{ st.title }}</span>
                </label>

                <button
                  type="button"
                  class="subtask-del-btn"
                  @click="handleDeleteSubtask(st.id)"
                  title="Hapus Subtask"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Quick Add Subtask Input -->
            <form @submit.prevent="handleAddSubtask" class="subtask-add-form">
              <div class="subtask-add-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <input
                  v-model="newSubtaskTitle"
                  type="text"
                  class="subtask-input"
                  placeholder="Tambah sub-tugas (Tekan Enter)..."
                />
              </div>
              <button
                type="submit"
                class="subtask-add-btn"
                :disabled="!newSubtaskTitle.trim()"
              >
                Tambah
              </button>
            </form>
          </section>

          <div class="detail-divider"></div>

          <!-- ─── RICH MARKDOWN WORKSPACE (NOTION STYLE) ─────────────────────── -->
          <section class="detail-section workspace-section">
            <div class="section-header">
              <div class="section-title-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h3 class="section-title">Dokumentasi & Catatan Markdown</h3>
              </div>

              <!-- Segmented Tab: Tulis vs Pratinjau -->
              <div class="md-tab-group" role="tablist">
                <button
                  type="button"
                  class="md-tab-btn"
                  :class="{ active: activeMdTab === 'write' }"
                  @click="activeMdTab = 'write'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Tulis</span>
                </button>
                <button
                  type="button"
                  class="md-tab-btn"
                  :class="{ active: activeMdTab === 'preview' }"
                  @click="activeMdTab = 'preview'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Pratinjau</span>
                </button>
              </div>
            </div>

            <!-- Markdown Toolbar (Write Mode Only) -->
            <div v-if="activeMdTab === 'write'" class="md-toolbar">
              <button type="button" class="tb-btn" @click="insertFormatting('**', '**', 'teks tebal')" title="Tebal (Bold)">
                <strong>B</strong>
              </button>
              <button type="button" class="tb-btn" @click="insertFormatting('*', '*', 'teks miring')" title="Miring (Italic)">
                <em>I</em>
              </button>
              <button type="button" class="tb-btn" @click="insertPrefix('## ')" title="Heading 2">
                H2
              </button>
              <button type="button" class="tb-btn" @click="insertPrefix('### ')" title="Heading 3">
                H3
              </button>
              <span class="tb-sep"></span>
              <button type="button" class="tb-btn" @click="insertPrefix('- ')" title="Daftar Bullet">
                • List
              </button>
              <button type="button" class="tb-btn" @click="insertFormatting('`', '`', 'kode')" title="Inline Code">
                &lt;/&gt;
              </button>
              <button type="button" class="tb-btn" @click="insertCodeBlock" title="Fenced Code Block">
                Code Block
              </button>
              <button type="button" class="tb-btn" @click="insertFormatting('> ', '', 'kutipan penting')" title="Kutipan (Quote)">
                &ldquo;&rdquo;
              </button>
              <button type="button" class="tb-btn" @click="insertFormatting('[', '](https://)', 'judul link')" title="Tautan (Link)">
                Link
              </button>
            </div>

            <!-- Editor Body: Textarea vs Rendered HTML -->
            <div class="md-container">
              <textarea
                v-if="activeMdTab === 'write'"
                ref="textareaRef"
                v-model="localMarkdown"
                class="md-textarea"
                rows="10"
                placeholder="Tulis catatan teknis, spesifikasi API, atau panduan pengerjaan menggunakan format Markdown..."
              ></textarea>

              <div
                v-else
                class="md-preview-pane"
                v-html="renderedMarkdownHtml"
              ></div>
            </div>

            <!-- Save Markdown Footer Bar -->
            <div class="md-save-row">
              <div class="save-status-indicator">
                <span v-if="isSavingDesc" class="save-state saving">
                  <span class="pulse-dot"></span> Menyimpan catatan...
                </span>
                <span v-else-if="descSavedRecently" class="save-state saved">
                  ✓ Catatan tersimpan
                </span>
                <span v-else class="save-state idle">
                  Format Markdown didukung
                </span>
              </div>
              <button
                type="button"
                class="save-md-btn"
                :disabled="isSavingDesc"
                @click="saveMarkdownDescription"
              >
                Simpan Catatan
              </button>
            </div>
          </section>

          <!-- ─── ATTACHMENTS FOOTER SUMMARY ────────────────────────────────── -->
          <div class="detail-footer-bar">
            <div class="attachments-summary">
              <span class="att-count-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                {{ totalAttachmentsCount }} Lampiran File
              </span>
              <button
                type="button"
                class="manage-att-btn"
                @click="openTaskAttachments"
              >
                Kelola Lampiran
              </button>
            </div>

            <button type="button" class="btn-done-modal" @click="handleClose">
              Selesai
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import { useFocusStore } from '~/stores/focusStore'
import type { Task, TaskPriority, TaskStatus, Subtask } from '~/types/task'
import { renderMarkdown } from '~/utils/markdown'

const taskStore = useTaskStore()
const focusStore = useFocusStore()

// ─── Active Task Reference ───────────────────────────────────────────────────
const activeTask = computed<Task | null>(() => taskStore.selectedTaskForDetail)

// ─── Local State ─────────────────────────────────────────────────────────────
const localTitle = ref<string>('')
const localMarkdown = ref<string>('')
const activeMdTab = ref<'write' | 'preview'>('write')
const newSubtaskTitle = ref<string>('')
const isSavingDesc = ref<boolean>(false)
const descSavedRecently = ref<boolean>(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Synchronize local form inputs when active task changes
watch(
  () => activeTask.value,
  (task) => {
    if (task) {
      localTitle.value = task.title || ''
      localMarkdown.value = task.description_markdown || ''
      activeMdTab.value = 'write'
      descSavedRecently.value = false
    }
  },
  { immediate: true }
)

// ─── Options & Computed Attributes ───────────────────────────────────────────
const priorityOptions: { value: TaskPriority; label: string; dotClass: string }[] = [
  { value: 'LOW', label: 'Rendah', dotClass: 'dot-low' },
  { value: 'MEDIUM', label: 'Sedang', dotClass: 'dot-medium' },
  { value: 'HIGH', label: 'Tinggi', dotClass: 'dot-high' },
  { value: 'URGENT', label: 'Mendesak', dotClass: 'dot-urgent' }
]

const statusLabel = computed<string>(() => {
  const s = activeTask.value?.status || 'TODO'
  switch (s) {
    case 'BACKLOG': return 'Backlog'
    case 'TODO': return 'To Do'
    case 'IN_PROGRESS': return 'In Progress'
    case 'DONE': return 'Done'
    default: return s
  }
})

const dueDateInputVal = computed<string>(() => {
  if (!activeTask.value?.due_date) return ''
  return activeTask.value.due_date.split('T')[0] ?? ''
})

const taskTags = computed<string[]>(() => {
  const t = activeTask.value?.tags
  if (Array.isArray(t)) return t
  return []
})

// ─── Subtasks Computeds & Handlers ───────────────────────────────────────────
const subtasksList = computed<Subtask[]>(() => {
  return activeTask.value?.subtasks || []
})

const totalSubtasksCount = computed<number>(() => subtasksList.value.length)

const completedSubtasksCount = computed<number>(() => {
  return subtasksList.value.filter(s => s.is_completed).length
})

const subtaskProgressPercent = computed<number>(() => {
  if (totalSubtasksCount.value === 0) return 0
  return Math.round((completedSubtasksCount.value / totalSubtasksCount.value) * 100)
})

const handleAddSubtask = async () => {
  if (!activeTask.value || !newSubtaskTitle.value.trim()) return
  const title = newSubtaskTitle.value
  newSubtaskTitle.value = ''
  await taskStore.addSubtask(activeTask.value.id, title)
}

const handleToggleSubtask = async (st: Subtask) => {
  await taskStore.toggleSubtask(st)
}

const handleDeleteSubtask = async (subtaskId: string) => {
  if (!activeTask.value) return
  await taskStore.deleteSubtask(subtaskId, activeTask.value.id)
}

// ─── Focus Mode & Duration Handlers ───────────────────────────────────────────
const startFocusFromModal = () => {
  if (!activeTask.value) return
  focusStore.startFocus(activeTask.value)
  taskStore.closeDetailModal()
}

const onEstimatedHoursChange = async (event: Event) => {
  if (!activeTask.value) return
  const val = (event.target as HTMLInputElement).value
  const numVal = val ? parseFloat(val) : 0
  await taskStore.editTask(activeTask.value, {
    title: activeTask.value.title,
    estimated_hours: numVal
  })
}

// ─── AI Subtask Breakdown (Sprint 2) ─────────────────────────────────────────
const isGeneratingAi = ref<boolean>(false)
const aiSuggestedSubtasks = ref<{ text: string; selected: boolean }[]>([])
const aiNotice = ref<string>('')

const triggerAiBreakdown = async () => {
  if (!activeTask.value || isGeneratingAi.value) return
  isGeneratingAi.value = true
  aiNotice.value = ''

  try {
    const res = await $fetch<{ success: boolean; subtasks: string[]; message?: string; isFallback?: boolean }>('/api/ai/breakdown', {
      method: 'POST',
      body: {
        title: activeTask.value.title,
        description: activeTask.value.description_markdown
      }
    })

    if (res && Array.isArray(res.subtasks)) {
      aiSuggestedSubtasks.value = res.subtasks.map(text => ({ text, selected: true }))
      if (res.message) {
        aiNotice.value = res.message
      }
    }
  } catch (err: any) {
    console.error('Error in triggerAiBreakdown:', err)
    aiNotice.value = 'Gagal memanggil AI: ' + (err.data?.statusMessage || err.message)
  } finally {
    isGeneratingAi.value = false
  }
}

const selectedAiCount = computed<number>(() => {
  return aiSuggestedSubtasks.value.filter(s => s.selected && s.text.trim()).length
})

const hasSelectedAiSubtasks = computed<boolean>(() => selectedAiCount.value > 0)

const applyAiSubtasks = async () => {
  if (!activeTask.value) return
  const items = aiSuggestedSubtasks.value.filter(s => s.selected && s.text.trim())
  for (const item of items) {
    await taskStore.addSubtask(activeTask.value.id, item.text.trim())
  }
  aiSuggestedSubtasks.value = []
  aiNotice.value = ''
}

const cancelAiSubtasks = () => {
  aiSuggestedSubtasks.value = []
  aiNotice.value = ''
}

// ─── Markdown Workspace Logic ────────────────────────────────────────────────
const renderedMarkdownHtml = computed<string>(() => {
  if (!localMarkdown.value.trim()) {
    return '<div class="md-empty-preview"><em>Belum ada catatan tertulis. Klik tab <strong>Tulis</strong> untuk menambahkan catatan atau dokumentasi markdown.</em></div>'
  }
  return renderMarkdown(localMarkdown.value)
})

const saveMarkdownDescription = async () => {
  if (!activeTask.value) return
  isSavingDesc.value = true
  const success = await taskStore.saveTaskDescription(activeTask.value.id, localMarkdown.value)
  isSavingDesc.value = false
  if (success) {
    descSavedRecently.value = true
    setTimeout(() => {
      descSavedRecently.value = false
    }, 3000)
  }
}

// Formatting helpers for Write mode
const insertFormatting = (prefix: string, suffix = '', placeholder = 'teks') => {
  const el = textareaRef.value
  if (!el) {
    localMarkdown.value += `${prefix}${placeholder}${suffix}`
    return
  }
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = el.value.substring(start, end) || placeholder
  const replacement = `${prefix}${selected}${suffix}`
  localMarkdown.value = el.value.substring(0, start) + replacement + el.value.substring(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
  })
}

const insertPrefix = (prefix: string) => {
  const el = textareaRef.value
  if (!el) {
    localMarkdown.value += `\n${prefix}`
    return
  }
  const start = el.selectionStart
  localMarkdown.value = el.value.substring(0, start) + `\n${prefix}` + el.value.substring(start)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + prefix.length + 1, start + prefix.length + 1)
  })
}

const insertCodeBlock = () => {
  insertFormatting('```ts\n', '\n```', '// Tulis kode di sini')
}

// ─── Header Quick Actions ────────────────────────────────────────────────────
const saveTitleChange = async () => {
  if (!activeTask.value) return
  const trimmed = localTitle.value.trim()
  if (!trimmed || trimmed === activeTask.value.title) return
  await taskStore.editTask(activeTask.value, { title: trimmed })
}

const updatePriority = async (p: TaskPriority) => {
  if (!activeTask.value) return
  await taskStore.editTask(activeTask.value, { title: activeTask.value.title, priority: p })
}

const onStatusChange = async (e: Event) => {
  if (!activeTask.value) return
  const newStatus = (e.target as HTMLSelectElement).value as TaskStatus
  await taskStore.updateTaskStatus(activeTask.value, newStatus)
}

const onProjectChange = async (e: Event) => {
  if (!activeTask.value) return
  const val = (e.target as HTMLSelectElement).value
  const projId = val ? val : null
  await taskStore.updateTaskProject(activeTask.value.id, projId)
}

const onDueDateChange = async (val: string) => {
  if (!activeTask.value) return
  const iso = val ? new Date(val).toISOString() : null
  await taskStore.editTask(activeTask.value, { title: activeTask.value.title, due_date: iso })
}

// ─── Attachments Trigger ─────────────────────────────────────────────────────
const totalAttachmentsCount = computed<number>(() => {
  if (!activeTask.value) return 0
  const atts = activeTask.value.task_attachments || []
  if (atts.length > 0) return atts.length
  return activeTask.value.cover_image_url ? 1 : 0
})

const openTaskAttachments = () => {
  if (!activeTask.value) return
  taskStore.openAttachmentModal(activeTask.value)
}

const handleClose = () => {
  taskStore.closeDetailModal()
}
</script>

<style scoped>
/* ─── MODAL BACKDROP ──────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--modal-backdrop-bg);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-y: auto;
}

/* ─── MODAL BOX DETAIL ────────────────────────────────────────────────────── */
.modal-box-detail {
  background: var(--modal-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 100%;
  max-width: 820px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: var(--shadow-elevated);
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-base);
}

/* ─── TOPBAR ──────────────────────────────────────────────────────────────── */
.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-subtle);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.detail-badge-id {
  font-family: monospace;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: 4px;
}

.detail-meta-sep {
  color: var(--text-muted);
}

.detail-meta-status {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11.5px;
  letter-spacing: 0.03em;
}

.status-backlog { color: var(--text-secondary); }
.status-todo { color: #60a5fa; }
.status-in_progress { color: var(--color-warning); }
.status-done { color: var(--color-success); }

.detail-close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}

.detail-close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* ─── HEADER & ATTRIBUTES SECTION ─────────────────────────────────────────── */
.detail-header-section {
  padding: 20px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-title-input {
  background: transparent;
  border: none;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-heading);
  font-family: inherit;
  padding: 2px 0;
  width: 100%;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease;
}

.detail-title-input:hover {
  border-color: var(--border-subtle);
}

.detail-title-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.detail-attrs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 24px;
  row-gap: 18px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px 20px;
  align-items: flex-start;
}

.attr-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attr-item.span-2 {
  grid-column: span 2;
}

.attr-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.priority-selector-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.attr-p-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 8px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.attr-p-btn:hover:not(.active) {
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.attr-p-btn.active {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-color: var(--accent-primary);
}

.p-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-low .p-dot { background: #94a3b8; }
.dot-medium .p-dot { background: #38bdf8; }
.dot-high .p-dot { background: #fb923c; }
.dot-urgent .p-dot { background: var(--color-danger); }

.attr-select {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  color: var(--input-color);
  font-size: 12px;
  padding: 0 10px;
  height: 32px;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  transition: border-color 0.15s ease;
}

.attr-select:hover,
.attr-select:focus {
  border-color: var(--accent-primary);
  outline: none;
}

@media (max-width: 768px) {
  .detail-attrs-grid {
    grid-template-columns: repeat(2, 1fr);
    column-gap: 20px;
    row-gap: 16px;
    padding: 14px 16px;
  }
  .attr-item.span-2 {
    grid-column: span 2;
  }
}

@media (max-width: 520px) {
  .detail-attrs-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .attr-item.span-2 {
    grid-column: span 1;
  }
}

.detail-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag-chip {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-soft);
  font-size: 11.5px;
  padding: 2px 7px;
  border-radius: 4px;
}

.detail-divider {
  height: 1px;
  background: var(--border-color);
  width: 100%;
}

/* ─── DETAIL SECTIONS ─────────────────────────────────────────────────────── */
.detail-section {
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.01em;
}

/* ─── SUBTASKS / CHECKLIST ────────────────────────────────────────────────── */
.subtask-ratio-badge {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.subtask-progress-track {
  width: 100%;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.subtask-progress-fill {
  height: 100%;
  background: var(--color-success);
  transform-origin: left;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subtask-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.subtask-item:hover {
  border-color: var(--border-subtle);
}

.subtask-check-label {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  flex: 1;
  user-select: none;
}

.subtask-checkbox {
  display: none;
}

.subtask-custom-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--border-subtle);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.subtask-item.is-completed .subtask-custom-box {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #ffffff;
}

.subtask-title-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

.subtask-item.is-completed .subtask-title-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.subtask-del-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s ease;
}

.subtask-item:hover .subtask-del-btn {
  opacity: 1;
}

.subtask-del-btn:hover {
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1);
}

.subtask-add-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.subtask-add-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-muted);
}

.subtask-input {
  background: transparent;
  border: none;
  width: 100%;
  color: var(--text-primary);
  font-size: 12.5px;
  font-family: inherit;
}

.subtask-input:focus {
  outline: none;
}

.subtask-add-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.subtask-add-btn:hover:not(:disabled) {
  background: var(--bg-active);
}

.subtask-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── RICH MARKDOWN WORKSPACE ─────────────────────────────────────────────── */
.md-tab-group {
  display: inline-flex;
  align-items: center;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.md-tab-btn {
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
  transition: all 0.15s ease;
}

.md-tab-btn:hover:not(.active) {
  color: var(--text-primary);
}

.md-tab-btn.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-weight: 600;
}

.md-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.tb-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  padding: 2px 7px;
  font-size: 11.5px;
  font-family: inherit;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tb-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.tb-sep {
  width: 1px;
  height: 14px;
  background: var(--border-color);
  margin: 0 3px;
}

.md-container {
  min-height: 180px;
}

.md-textarea {
  width: 100%;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
  scrollbar-width: thin;
}

.md-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(0, 90, 251, 0.2);
}

.md-preview-pane {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px 18px;
  min-height: 180px;
  color: var(--text-primary);
  font-size: 13.5px;
  line-height: 1.65;
}

.md-empty-preview {
  color: var(--text-muted);
  font-size: 13px;
}

/* Markdown Styled Output */
:deep(.md-h1) { font-size: 18px; font-weight: 700; margin: 12px 0 6px; color: var(--text-heading); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
:deep(.md-h2) { font-size: 16px; font-weight: 600; margin: 10px 0 5px; color: var(--text-primary); }
:deep(.md-h3) { font-size: 14.5px; font-weight: 600; margin: 8px 0 4px; color: var(--text-soft); }
:deep(.md-p) { margin: 6px 0; }
:deep(.md-ul), :deep(.md-ol) { margin: 6px 0 6px 20px; padding: 0; }
:deep(.md-ul li), :deep(.md-ol li) { margin-bottom: 3px; }
:deep(.md-quote) {
  margin: 10px 0;
  padding: 8px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-soft);
  font-style: italic;
}
:deep(.md-inline-code) {
  font-family: monospace;
  font-size: 12px;
  background: var(--bg-elevated);
  color: var(--text-soft);
  padding: 2px 5px;
  border-radius: 4px;
}
:deep(.md-code-block) {
  background: var(--bg-base);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin: 10px 0;
  position: relative;
  overflow-x: auto;
}
:deep(.code-lang-badge) {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 10.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-family: monospace;
}
:deep(.md-code-block pre) {
  margin: 0;
  padding: 12px 14px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-soft);
}
:deep(.md-link) {
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 2px;
}
:deep(.md-hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 14px 0;
}

.md-save-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.save-state {
  font-size: 12px;
}
.save-state.saving { color: var(--color-warning); }
.save-state.saved { color: var(--color-success); font-weight: 500; }
.save-state.idle { color: var(--text-muted); }

.pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-warning);
  margin-right: 4px;
  animation: pulse-dot-anim 1s infinite alternate;
}

@keyframes pulse-dot-anim {
  from { opacity: 0.3; }
  to { opacity: 1; }
}

.save-md-btn {
  background: var(--accent-primary);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.save-md-btn:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.save-md-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── FOOTER BAR ──────────────────────────────────────────────────────────── */
.detail-footer-bar {
  padding: 14px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.attachments-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.att-count-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.manage-att-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-soft);
  font-size: 11.5px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.manage-att-btn:hover {
  color: var(--text-primary);
  background: var(--bg-active);
}

.btn-done-modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 12.5px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.btn-done-modal:hover {
  background: var(--bg-active);
}

/* ─── FOCUS & DURATION ATTRIBUTES ───────────────────────────────────────── */
.btn-start-focus-top {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-start-focus-top:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.attr-input-num {
  width: 100%;
  background-color: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--input-color);
  font-size: 13px;
  font-family: inherit;
}
.attr-input-num:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.actual-hours-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 5px 10px;
}
.hours-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.quick-focus-icon-btn {
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--accent-primary) 55%, var(--text-primary));
  background: rgba(0, 90, 251, 0.1);
  border: 1px solid rgba(0, 90, 251, 0.25);
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  transition: all 150ms ease;
}
.quick-focus-icon-btn:hover {
  background: rgba(0, 90, 251, 0.2);
}

/* ─── AI SUBTASK BREAKDOWN (SPRINT 2) ───────────────────────────────────── */
.section-actions-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ai-breakdown-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: rgba(0, 90, 251, 0.12);
  border: 1px solid rgba(0, 90, 251, 0.35);
  color: color-mix(in srgb, var(--accent-primary) 55%, var(--text-primary));
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.ai-breakdown-btn:hover:not(:disabled) {
  background-color: rgba(0, 90, 251, 0.22);
  border-color: var(--accent-primary);
}
.ai-breakdown-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-suggestion-card {
  margin: 12px 0 16px 0;
  padding: 14px;
  background-color: var(--bg-subtle);
  border: 1px solid rgba(0, 90, 251, 0.25);
  border-radius: 10px;
}
.ai-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ai-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.ai-close-preview {
  background: transparent;
  border: none;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}
.ai-close-preview:hover {
  color: var(--text-primary);
}
.ai-card-notice {
  font-size: 11.5px;
  color: var(--color-warning);
  margin: 0 0 6px 0;
}
.ai-card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
}
.ai-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.ai-item-check {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
}
.ai-checkbox {
  accent-color: var(--accent-primary);
  cursor: pointer;
}
.ai-item-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12.5px;
  font-family: inherit;
}
.ai-item-input:focus {
  outline: none;
}
.ai-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-apply-ai {
  padding: 6px 14px;
  background-color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}
.btn-apply-ai:hover:not(:disabled) {
  filter: brightness(1.1);
}
.btn-apply-ai:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-cancel-ai {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
}
.btn-cancel-ai:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* ─── TRANSITIONS ─────────────────────────────────────────────────────────── */
.detail-modal-enter-active,
.detail-modal-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.detail-modal-enter-from,
.detail-modal-leave-to {
  opacity: 0;
}

.detail-modal-enter-active .modal-box-detail,
.detail-modal-leave-active .modal-box-detail {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.detail-modal-enter-from .modal-box-detail {
  transform: scale(0.95) translateY(8px);
}

.detail-modal-leave-to .modal-box-detail {
  transform: scale(0.96);
}
</style>
