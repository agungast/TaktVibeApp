<template>
  <div
    class="kanban-card"
    :class="{ 'is-dragging': isDragging, 'is-completed': task.is_completed || task.status === 'DONE' }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    :id="`kanban-card-${task.id}`"
  >
    <!-- Card Header: Priority Badge & Action Buttons -->
    <div class="card-top">
      <div class="card-badges">
        <!-- Space Badge -->
        <span
          v-if="cardProject"
          class="card-project-badge"
          :style="{ color: cardProject.color, borderColor: `${cardProject.color}40`, background: `${cardProject.color}15` }"
          @click.stop="taskStore.setActiveProject(cardProject.id)"
          :title="`Ruang Kerja: ${cardProject.name} — Klik untuk filter`"
        >
          <span class="proj-badge-icon">{{ cardProject.icon }}</span>
          <span class="proj-badge-name">{{ cardProject.name }}</span>
        </span>

        <span class="priority-badge" :class="priorityMeta.class">
          <span class="priority-dot"></span>
          {{ priorityMeta.label }}
        </span>
      </div>

      <div class="card-actions">
        <button
          type="button"
          class="card-action-btn detail-btn"
          @click.stop="taskStore.openDetailModal(task)"
          title="Buka Catatan & Detail Tugas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </button>
        <button
          type="button"
          class="card-action-btn edit-btn"
          @click.stop="openEdit"
          title="Edit Atribut Tugas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          type="button"
          class="card-action-btn delete-btn"
          @click.stop="showConfirm = true"
          title="Hapus Tugas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Card Title -->
    <h4
      class="card-title"
      :class="{ 'completed-title': task.is_completed || task.status === 'DONE' }"
      @click.stop="taskStore.openDetailModal(task)"
      title="Klik untuk membuka detail dan catatan markdown"
    >
      {{ task.title || task.task || 'Tanpa Judul' }}
    </h4>

    <!-- Meta: Subtasks, Doc, Tags & Estimated Hours -->
    <div v-if="(task.subtasks && task.subtasks.length > 0) || task.description_markdown || (normalizedTags.length > 0) || task.estimated_hours" class="card-meta-row">
      <!-- Subtasks Badge -->
      <span
        v-if="task.subtasks && task.subtasks.length > 0"
        class="card-subtask-badge"
        @click.stop="taskStore.openDetailModal(task)"
        :title="`${completedSubtasksCount} dari ${task.subtasks.length} sub-tugas selesai`"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        {{ completedSubtasksCount }}/{{ task.subtasks.length }}
      </span>

      <!-- Markdown Doc Badge -->
      <span
        v-if="task.description_markdown"
        class="card-doc-badge"
        @click.stop="taskStore.openDetailModal(task)"
        title="Memiliki catatan markdown"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        Doc
      </span>

      <span v-for="tag in normalizedTags" :key="tag" class="meta-tag-badge">#{{ tag }}</span>
      <span v-if="task.estimated_hours" class="meta-hours-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        {{ task.estimated_hours }}h
      </span>
    </div>

    <!-- Card Footer: Due Date & Attachments -->
    <div class="card-footer">
      <!-- Due Date -->
      <div class="due-wrap">
        <span v-if="task.due_date" class="due-badge" :class="{ 'is-overdue': isOverdue }">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{{ formatDueDate(task.due_date) }}</span>
        </span>
        <span v-else class="no-due-text">Tanpa tenggat</span>
      </div>

      <!-- Attachments Trigger -->
      <div class="attachments-wrap">
        <button
          v-if="totalAttachments > 0"
          type="button"
          class="att-trigger-btn"
          @click.stop="taskStore.openAttachmentModal(task)"
          :title="`${totalAttachments} Lampiran — Klik untuk kelola`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          <span>{{ totalAttachments }}</span>
          <span v-if="hasPrivateAttachments" class="lock-dot" title="Memiliki file privat"></span>
        </button>

        <button
          v-else
          type="button"
          class="att-add-quick-btn"
          @click.stop="taskStore.openAttachmentModal(task)"
          title="Tambah Lampiran"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>File</span>
        </button>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfirm" class="modal-backdrop" @click.self="showConfirm = false">
          <div class="modal-box">
            <div class="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
            <h3 class="modal-title">Hapus Tugas</h3>
            <p class="modal-message">Apakah ingin menghapus tugas ini secara permanen?</p>
            <p class="modal-task-name">"{{ task.title || task.task || 'Tugas' }}"</p>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="showConfirm = false">Batal</button>
              <button type="button" class="btn-confirm" @click="confirmDelete">Hapus</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Edit Tugas Komprehensif -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEdit" class="modal-backdrop" @click.self="showEdit = false">
          <div class="modal-box modal-box-lg">
            <div class="modal-header-edit">
              <div class="modal-icon edit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Edit Atribut Tugas</h3>
                <p class="modal-message">Perbarui informasi dan alur kerja tugas</p>
              </div>
            </div>

            <form @submit.prevent="confirmEdit" class="edit-form">
              <!-- Nama Tugas -->
              <div class="edit-field">
                <label class="edit-label">Nama Tugas <span class="required">*</span></label>
                <input
                  ref="editInputRef"
                  v-model="editText"
                  type="text"
                  class="edit-input"
                  placeholder="Nama tugas..."
                  maxlength="255"
                  required
                />
              </div>

              <!-- Prioritas -->
              <div class="edit-field">
                <label class="edit-label">Prioritas</label>
                <div class="edit-priority-grid">
                  <button
                    v-for="p in priorityOptions"
                    :key="p.value"
                    type="button"
                    class="edit-p-btn"
                    :class="[p.dotClass, { active: editPriority === p.value }]"
                    @click="editPriority = p.value"
                  >
                    <span class="p-dot"></span>
                    <span>{{ p.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Status & Deadline Grid -->
              <div class="edit-grid-2col">
                <div class="edit-field">
                  <label class="edit-label">Status Alur</label>
                  <select v-model="editStatus" class="edit-select">
                    <option v-for="s in statusOptions" :key="s.value" :value="s.value">
                      {{ s.label }}
                    </option>
                  </select>
                </div>
                <div class="edit-field">
                  <label class="edit-label">Batas Waktu</label>
                  <input v-model="editDueDate" type="date" class="edit-input edit-date" />
                </div>
              </div>

              <!-- Estimasi & Tags Grid -->
              <div class="edit-grid-2col">
                <div class="edit-field">
                  <label class="edit-label">Estimasi (Jam)</label>
                  <input
                    v-model="editEstimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    class="edit-input"
                    placeholder="0"
                  />
                </div>
                <div class="edit-field">
                  <label class="edit-label">Tag / Label (Enter)</label>
                  <input
                    v-model="editTagInput"
                    type="text"
                    class="edit-input"
                    placeholder="frontend, bug..."
                    @keydown.enter.prevent="addEditTag"
                    @keydown.,.prevent="addEditTag"
                  />
                </div>
              </div>

              <!-- Ruang Kerja (Space) -->
              <div class="edit-field">
                <label class="edit-label">Ruang Kerja (Space)</label>
                <select v-model="editProjectId" class="edit-select">
                  <option :value="null">Tanpa Ruang Kerja</option>
                  <option v-for="p in taskStore.projects" :key="p.id" :value="p.id">
                    {{ p.icon }} {{ p.name }}
                  </option>
                </select>
              </div>

              <!-- Tag list in edit modal -->
              <div v-if="editTags.length > 0" class="edit-tags-list">
                <span v-for="(t, idx) in editTags" :key="t" class="edit-tag-badge">
                  #{{ t }}
                  <button type="button" class="edit-tag-del" @click="removeEditTag(idx)">&times;</button>
                </span>
              </div>

              <p v-if="editError" class="edit-error">{{ editError }}</p>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" @click="showEdit = false">Batal</button>
                <button type="submit" class="btn-save" :disabled="!editText.trim()">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import type { Task, TaskPriority, TaskStatus, TaskEditPayload } from '~/types/task'

const taskStore = useTaskStore()

// Props
const props = defineProps<{
  task: Task
}>()

// Emits
const emit = defineEmits<{
  edit: [payload: { task: Task; payload: string | TaskEditPayload }]
  delete: [task: Task]
  'update-status': [payload: { task: Task; status: TaskStatus }]
}>()

const isDragging = ref<boolean>(false)

// ─── Drag & Drop ─────────────────────────────────────────────────────────────
const onDragStart = (e: DragEvent) => {
  isDragging.value = true
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(props.task.id))
  }
}

const onDragEnd = () => {
  isDragging.value = false
}

// ─── Options & Computed ──────────────────────────────────────────────────────
const priorityOptions: { value: TaskPriority; label: string; dotClass: string }[] = [
  { value: 'LOW', label: 'Rendah', dotClass: 'dot-low' },
  { value: 'MEDIUM', label: 'Sedang', dotClass: 'dot-medium' },
  { value: 'HIGH', label: 'Tinggi', dotClass: 'dot-high' },
  { value: 'URGENT', label: 'Mendesak', dotClass: 'dot-urgent' }
]

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' }
]

const priorityMeta = computed(() => {
  const p = props.task.priority || 'MEDIUM'
  switch (p) {
    case 'LOW':
      return { label: 'Rendah', class: 'p-low' }
    case 'MEDIUM':
      return { label: 'Sedang', class: 'p-medium' }
    case 'HIGH':
      return { label: 'Tinggi', class: 'p-high' }
    case 'URGENT':
      return { label: 'Mendesak', class: 'p-urgent' }
    default:
      return { label: 'Sedang', class: 'p-medium' }
  }
})

const cardProject = computed(() => {
  if (props.task.project) return props.task.project
  if (props.task.project_id) {
    return taskStore.projects.find(p => String(p.id) === String(props.task.project_id)) || null
  }
  return null
})

const completedSubtasksCount = computed<number>(() => {
  return (props.task.subtasks || []).filter(s => s.is_completed).length
})

const normalizedTags = computed<string[]>(() => {
  const raw = props.task?.tags
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean)
  if (typeof raw === 'string') {
    return (raw as string)
      .replace(/^\{|\}$/g, '')
      .split(',')
      .map(s => s.replace(/["']/g, '').trim())
      .filter(Boolean)
  }
  return []
})

const formatDueDate = (iso: string | null | undefined) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return '-'
  }
}

const isOverdue = computed(() => {
  if (!props.task?.due_date || props.task.status === 'DONE' || props.task.is_completed) return false
  try {
    const due = new Date(props.task.due_date)
    if (isNaN(due.getTime())) return false
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return due < now
  } catch {
    return false
  }
})

// Attachments
const attachments = computed(() => props.task?.task_attachments || [])
const totalAttachments = computed(() => {
  if (attachments.value.length > 0) return attachments.value.length
  return props.task?.cover_image_url || props.task?.image_url ? 1 : 0
})

const hasPrivateAttachments = computed(() => {
  return attachments.value.some(a => a.is_private)
})

// ─── Delete Modal ────────────────────────────────────────────────────────────
const showConfirm = ref<boolean>(false)
const confirmDelete = (): void => {
  emit('delete', props.task)
  showConfirm.value = false
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
const showEdit = ref<boolean>(false)
const editText = ref<string>('')
const editPriority = ref<TaskPriority>('MEDIUM')
const editStatus = ref<TaskStatus>('TODO')
const editDueDate = ref<string>('')
const editEstimatedHours = ref<number | null>(null)
const editProjectId = ref<string | null>(null)
const editTags = ref<string[]>([])
const editTagInput = ref<string>('')
const editError = ref<string>('')
const editInputRef = ref<HTMLInputElement | null>(null)

const openEdit = async (): Promise<void> => {
  editText.value = props.task.title || props.task.task || ''
  editPriority.value = props.task.priority || 'MEDIUM'
  editStatus.value = props.task.status || (props.task.is_completed ? 'DONE' : 'TODO')
  editDueDate.value = props.task.due_date ? (props.task.due_date.split('T')[0] ?? '') : ''
  editEstimatedHours.value = props.task.estimated_hours || null
  editProjectId.value = props.task.project_id || null
  editTags.value = [...normalizedTags.value]
  editTagInput.value = ''
  editError.value = ''
  showEdit.value = true
  await nextTick()
  editInputRef.value?.focus()
}

const addEditTag = () => {
  const clean = editTagInput.value.trim().replace(/^#/, '').toLowerCase()
  if (clean && !editTags.value.includes(clean)) {
    editTags.value.push(clean)
  }
  editTagInput.value = ''
}

const removeEditTag = (idx: number) => {
  editTags.value.splice(idx, 1)
}

const confirmEdit = (): void => {
  const trimmed = editText.value.trim()
  if (!trimmed) {
    editError.value = 'Nama tugas tidak boleh kosong.'
    return
  }
  if (editTagInput.value.trim()) {
    addEditTag()
  }
  emit('edit', {
    task: props.task,
    payload: {
      title: trimmed,
      priority: editPriority.value,
      status: editStatus.value,
      due_date: editDueDate.value ? new Date(editDueDate.value).toISOString() : null,
      estimated_hours: editEstimatedHours.value ? Number(editEstimatedHours.value) : 0,
      tags: [...editTags.value],
      project_id: editProjectId.value
    }
  })
  showEdit.value = false
}
</script>

<style scoped>
.kanban-card {
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.kanban-card:hover {
  border-color: #2d3b55;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card.is-dragging {
  opacity: 0.45;
  border-style: dashed;
  border-color: #005afb;
}

.kanban-card.is-completed {
  opacity: 0.75;
}

/* Card Top: Priority & Actions */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.card-project-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 11.5px;
  font-weight: 550;
  cursor: pointer;
  max-width: 130px;
  transition: opacity 0.15s ease;
}

.card-project-badge:hover {
  opacity: 0.85;
}

.proj-badge-icon {
  font-size: 11px;
  line-height: 1;
}

.proj-badge-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.priority-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.priority-badge.p-low {
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.priority-badge.p-medium {
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.priority-badge.p-high {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.priority-badge.p-urgent {
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.card-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.card-action-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.card-action-btn:hover {
  background: #172136;
  border-color: #2d3b55;
  color: #ffffff;
}

.card-action-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.card-action-btn.detail-btn:hover {
  background: rgba(79, 70, 229, 0.14);
  border-color: rgba(79, 70, 229, 0.35);
  color: #a5b4fc;
}

/* Card Title */
.card-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.45;
  word-break: break-word;
  cursor: pointer;
  transition: color 0.15s ease;
}

.card-title:hover:not(.completed-title) {
  color: #818cf8;
}

.completed-title {
  text-decoration: line-through;
  color: #94a3b8;
}

/* Meta: Tags, Subtasks, Hours */
.card-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.card-subtask-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  font-weight: 600;
  color: #4ade80;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.3;
  cursor: pointer;
  transition: all 0.15s ease;
}

.card-subtask-badge:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
}

.card-doc-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  font-weight: 500;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.3;
  cursor: pointer;
  transition: all 0.15s ease;
}

.card-doc-badge:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.meta-tag-badge {
  font-size: 11.5px;
  font-weight: 500;
  color: #94a3b8;
  background: #090d16;
  border: 1px solid #1f2a3f;
  padding: 2px 7px;
  border-radius: 4px;
  line-height: 1.3;
}

.meta-hours-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 600;
  color: #cbd5e1;
  background: #172136;
  border: 1px solid #2d3b55;
  padding: 2px 7px;
  border-radius: 4px;
  line-height: 1.3;
}

/* Card Footer: Due Date & Attachments */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid #172136;
  font-size: 11.5px;
}

.due-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 5px;
  background: #090d16;
  border: 1px solid #1f2a3f;
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 500;
}

.due-badge.is-overdue {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.no-due-text {
  color: #64748b;
  font-size: 11.5px;
}

.att-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 5px;
  background: #090d16;
  border: 1px solid #1f2a3f;
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.att-trigger-btn:hover {
  background: #172136;
  border-color: #005afb;
  color: #ffffff;
}

.lock-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f59e0b;
}

.att-add-quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 5px;
  background: transparent;
  border: 1px dashed #2d3b55;
  color: #94a3b8;
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.att-add-quick-btn:hover {
  border-color: #005afb;
  color: #ffffff;
  background: #172136;
}

/* ─── Modal Styles ────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-box {
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 12px;
  padding: 24px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
}

.modal-box-lg {
  max-width: 480px;
  text-align: left;
}

.modal-icon {
  width: 48px;
  height: 48px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  color: #f87171;
}

.modal-header-edit {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  text-align: left;
}

.modal-header-edit .modal-icon {
  margin: 0;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
}

.edit-icon {
  background: #172136 !important;
  color: #f1f5f9 !important;
}

.modal-title {
  font-size: 16.5px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 4px;
}

.modal-message {
  font-size: 13.5px;
  color: #cbd5e1;
  margin: 0 0 6px;
}

.modal-task-name {
  font-size: 13px;
  color: #cbd5e1;
  font-style: italic;
  margin: 0 0 20px;
  word-break: break-word;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.btn-cancel {
  flex: 1;
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid #1f2a3f;
  background: #090d16;
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-cancel:hover {
  background: #172136;
  color: #ffffff;
}

.btn-confirm {
  flex: 1;
  padding: 9px 16px;
  border-radius: 8px;
  border: none;
  background: #ef4444;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-confirm:hover {
  background: #dc2626;
}

/* Edit Form */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.edit-label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.required {
  color: #f87171;
}

.edit-priority-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.edit-p-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 4px;
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.edit-p-btn:hover {
  background: #172136;
  color: #ffffff;
}

.edit-p-btn.active {
  border-color: #005afb;
  background: #172136;
  color: #ffffff;
  box-shadow: 0 0 0 1px #005afb;
}

.p-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-low .p-dot { background: #94a3b8; }
.dot-medium .p-dot { background: #60a5fa; }
.dot-high .p-dot { background: #fbbf24; }
.dot-urgent .p-dot { background: #f87171; }

.edit-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.edit-select,
.edit-date {
  color-scheme: dark;
}

.edit-input,
.edit-select {
  width: 100%;
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 8px 12px;
  color: #f1f5f9;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.edit-input:focus,
.edit-select:focus {
  border-color: #005afb;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.edit-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.edit-tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  color: #cbd5e1;
  background: #090d16;
  border: 1px solid #1f2a3f;
  padding: 2px 7px;
  border-radius: 5px;
}

.edit-tag-del {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0;
}

.edit-tag-del:hover {
  color: #f87171;
}

.edit-error {
  font-size: 12px;
  color: #f87171;
  margin: -4px 0 0;
}

.btn-save {
  flex: 1;
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #005afb;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-save:hover:not(:disabled) {
  background: #004ecc;
}

.btn-save:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-enter-from .modal-box {
  transform: scale(0.92) translateY(6px);
}
.modal-leave-to .modal-box {
  transform: scale(0.94);
}
</style>
