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
                  :value="activeTask.status || (activeTask.is_completed ? 'DONE' : 'TODO')"
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
                <input
                  type="date"
                  class="attr-date-input"
                  :value="dueDateInputVal"
                  @change="onDueDateChange($event)"
                />
              </div>

              <!-- Estimasi Jam -->
              <div class="attr-item">
                <span class="attr-label">Estimasi</span>
                <div class="attr-hours-wrap">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    class="attr-hours-input"
                    :value="activeTask.estimated_hours || ''"
                    placeholder="0"
                    @change="onHoursChange($event)"
                  />
                  <span class="attr-hours-unit">Jam</span>
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
              <span class="subtask-ratio-badge">
                {{ completedSubtasksCount }} dari {{ totalSubtasksCount }} Selesai ({{ subtaskProgressPercent }}%)
              </span>
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
import type { Task, TaskPriority, TaskStatus, Subtask } from '~/types/task'
import { renderMarkdown } from '~/utils/markdown'

const taskStore = useTaskStore()

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
      localTitle.value = task.title || task.task || ''
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
  const s = activeTask.value?.status || (activeTask.value?.is_completed ? 'DONE' : 'TODO')
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

const onDueDateChange = async (e: Event) => {
  if (!activeTask.value) return
  const val = (e.target as HTMLInputElement).value
  const iso = val ? new Date(val).toISOString() : null
  await taskStore.editTask(activeTask.value, { title: activeTask.value.title, due_date: iso })
}

const onHoursChange = async (e: Event) => {
  if (!activeTask.value) return
  const val = parseFloat((e.target as HTMLInputElement).value) || 0
  await taskStore.editTask(activeTask.value, { title: activeTask.value.title, estimated_hours: val })
}

// ─── Attachments Trigger ─────────────────────────────────────────────────────
const totalAttachmentsCount = computed<number>(() => {
  if (!activeTask.value) return 0
  const atts = activeTask.value.task_attachments || []
  if (atts.length > 0) return atts.length
  return activeTask.value.cover_image_url || activeTask.value.image_url ? 1 : 0
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
  background: rgba(4, 7, 13, 0.78);
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
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 12px;
  width: 100%;
  max-width: 820px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
  scrollbar-width: thin;
  scrollbar-color: #1f2a3f #090d16;
}

/* ─── TOPBAR ──────────────────────────────────────────────────────────────── */
.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #172136;
  background: #0d1422;
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
  color: #94a3b8;
  background: #172136;
  padding: 2px 6px;
  border-radius: 4px;
}

.detail-meta-sep {
  color: #475569;
}

.detail-meta-status {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11.5px;
  letter-spacing: 0.03em;
}

.status-backlog { color: #94a3b8; }
.status-todo { color: #60a5fa; }
.status-in_progress { color: #fbbf24; }
.status-done { color: #4ade80; }

.detail-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}

.detail-close-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.05);
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
  color: #f8fafc;
  font-family: inherit;
  padding: 2px 0;
  width: 100%;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s ease;
}

.detail-title-input:hover {
  border-color: #2d3b55;
}

.detail-title-input:focus {
  outline: none;
  border-color: #005afb;
}

.detail-attrs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 24px;
  row-gap: 18px;
  background: #090d16;
  border: 1px solid #1f2a3f;
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
  color: #94a3b8;
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
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  padding: 0 8px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #94a3b8;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.attr-p-btn:hover:not(.active) {
  color: #f1f5f9;
  border-color: #2d3b55;
}

.attr-p-btn.active {
  color: #f1f5f9;
  background: #172136;
  border-color: #005afb;
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
.dot-urgent .p-dot { background: #f87171; }

.attr-select {
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  color: #f1f5f9;
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
  border-color: #3b4d6b;
  outline: none;
}

.attr-date-input {
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 12px;
  padding: 0 10px;
  height: 32px;
  font-family: inherit;
  width: 100%;
  transition: border-color 0.15s ease;
}

.attr-date-input:hover,
.attr-date-input:focus {
  border-color: #3b4d6b;
  outline: none;
}

.attr-hours-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attr-hours-input {
  width: 68px;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 12px;
  padding: 0 10px;
  height: 32px;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.attr-hours-input:hover,
.attr-hours-input:focus {
  border-color: #3b4d6b;
  outline: none;
}

.attr-hours-unit {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
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
  background: #172136;
  border: 1px solid #1f2a3f;
  color: #cbd5e1;
  font-size: 11.5px;
  padding: 2px 7px;
  border-radius: 4px;
}

.detail-divider {
  height: 1px;
  background: #172136;
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
  color: #f1f5f9;
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
  color: #94a3b8;
  background: #090d16;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #172136;
}

.subtask-progress-track {
  width: 100%;
  height: 4px;
  background: #172136;
  border-radius: 2px;
  overflow: hidden;
}

.subtask-progress-fill {
  height: 100%;
  background: #4ade80;
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
  background: #0d1422;
  border: 1px solid #172136;
  border-radius: 6px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.subtask-item:hover {
  border-color: #243048;
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
  border: 1.5px solid #475569;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111726;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.subtask-item.is-completed .subtask-custom-box {
  background: #22c55e;
  border-color: #22c55e;
  color: #ffffff;
}

.subtask-title-text {
  font-size: 13px;
  color: #f1f5f9;
  line-height: 1.4;
}

.subtask-item.is-completed .subtask-title-text {
  text-decoration: line-through;
  color: #64748b;
}

.subtask-del-btn {
  background: transparent;
  border: none;
  color: #64748b;
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
  color: #f87171;
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
  background: #090d16;
  border: 1px solid #172136;
  border-radius: 6px;
  padding: 6px 10px;
  color: #64748b;
}

.subtask-input {
  background: transparent;
  border: none;
  width: 100%;
  color: #f1f5f9;
  font-size: 12.5px;
  font-family: inherit;
}

.subtask-input:focus {
  outline: none;
}

.subtask-add-btn {
  background: #172136;
  border: 1px solid #2d3b55;
  color: #f1f5f9;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.subtask-add-btn:hover:not(:disabled) {
  background: #243048;
}

.subtask-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── RICH MARKDOWN WORKSPACE ─────────────────────────────────────────────── */
.md-tab-group {
  display: inline-flex;
  align-items: center;
  background: #090d16;
  border: 1px solid #1f2a3f;
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
  color: #94a3b8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
  transition: all 0.15s ease;
}

.md-tab-btn:hover:not(.active) {
  color: #f1f5f9;
}

.md-tab-btn.active {
  background: #172136;
  color: #f1f5f9;
  font-weight: 600;
}

.md-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  background: #090d16;
  border: 1px solid #172136;
  border-radius: 6px;
}

.tb-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  padding: 2px 7px;
  font-size: 11.5px;
  font-family: inherit;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tb-btn:hover {
  background: #172136;
  color: #f1f5f9;
  border-color: #2d3b55;
}

.tb-sep {
  width: 1px;
  height: 14px;
  background: #1f2a3f;
  margin: 0 3px;
}

.md-container {
  min-height: 180px;
}

.md-textarea {
  width: 100%;
  background: #090d16;
  border: 1px solid #172136;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  resize: vertical;
  scrollbar-width: thin;
}

.md-textarea:focus {
  outline: none;
  border-color: #005afb;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.25);
}

.md-preview-pane {
  background: #090d16;
  border: 1px solid #172136;
  border-radius: 8px;
  padding: 16px 18px;
  min-height: 180px;
  color: #f1f5f9;
  font-size: 13.5px;
  line-height: 1.65;
}

.md-empty-preview {
  color: #64748b;
  font-size: 13px;
}

/* Markdown Styled Output */
:deep(.md-h1) { font-size: 18px; font-weight: 700; margin: 12px 0 6px; color: #f8fafc; border-bottom: 1px solid #172136; padding-bottom: 4px; }
:deep(.md-h2) { font-size: 16px; font-weight: 600; margin: 10px 0 5px; color: #f1f5f9; }
:deep(.md-h3) { font-size: 14.5px; font-weight: 600; margin: 8px 0 4px; color: #e2e8f0; }
:deep(.md-p) { margin: 6px 0; }
:deep(.md-ul), :deep(.md-ol) { margin: 6px 0 6px 20px; padding: 0; }
:deep(.md-ul li), :deep(.md-ol li) { margin-bottom: 3px; }
:deep(.md-quote) {
  margin: 10px 0;
  padding: 8px 14px;
  background: rgba(30, 41, 59, 0.35);
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  color: #cbd5e1;
  font-style: italic;
}
:deep(.md-inline-code) {
  font-family: monospace;
  font-size: 12px;
  background: #172136;
  color: #a5b4fc;
  padding: 2px 5px;
  border-radius: 4px;
}
:deep(.md-code-block) {
  background: #050811;
  border: 1px solid #172136;
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
  color: #64748b;
  text-transform: uppercase;
  font-family: monospace;
}
:deep(.md-code-block pre) {
  margin: 0;
  padding: 12px 14px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #e2e8f0;
}
:deep(.md-link) {
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 2px;
}
:deep(.md-hr) {
  border: none;
  border-top: 1px solid #172136;
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
.save-state.saving { color: #fbbf24; }
.save-state.saved { color: #4ade80; font-weight: 500; }
.save-state.idle { color: #64748b; }

.pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  margin-right: 4px;
  animation: pulse-dot-anim 1s infinite alternate;
}

@keyframes pulse-dot-anim {
  from { opacity: 0.3; }
  to { opacity: 1; }
}

.save-md-btn {
  background: #005afb;
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
  background: #004ecc;
}

.save-md-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── FOOTER BAR ──────────────────────────────────────────────────────────── */
.detail-footer-bar {
  padding: 14px 24px;
  border-top: 1px solid #172136;
  background: #0d1422;
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
  color: #94a3b8;
}

.manage-att-btn {
  background: #172136;
  border: 1px solid #2d3b55;
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.manage-att-btn:hover {
  color: #f1f5f9;
  background: #243048;
}

.btn-done-modal {
  background: #172136;
  border: 1px solid #2d3b55;
  color: #f1f5f9;
  font-size: 12.5px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.btn-done-modal:hover {
  background: #243048;
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
