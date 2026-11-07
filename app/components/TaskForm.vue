<template>
  <form @submit.prevent="handleSubmit" class="task-form">
    <div class="form-fields-wrapper">
      <!-- Input Teks Tugas -->
      <div class="form-field">
        <label class="form-label">Nama Tugas <span class="required">*</span></label>
        <div class="input-wrapper">
          <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <input
            id="task-title-input"
            v-model="localTaskText"
            type="text"
            placeholder="Deskripsikan tugas Anda..."
            required
            class="text-input"
            :disabled="uploading"
          />
        </div>
      </div>

      <!-- Prioritas Tugas (Segmented Selector) -->
      <div class="form-field">
        <label class="form-label">Prioritas Tugas</label>
        <div class="priority-selector">
          <button
            v-for="p in priorityOptions"
            :key="p.value"
            :id="`priority-btn-${p.value.toLowerCase()}`"
            type="button"
            class="priority-btn"
            :class="[p.dotClass, { active: selectedPriority === p.value }]"
            @click="selectedPriority = p.value"
            :disabled="uploading"
          >
            <span class="p-dot"></span>
            <span>{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- Grid 2 Kolom: Ruang Kerja & Status Alur -->
      <div class="form-row-2col">
        <!-- Ruang Kerja (Project Space) -->
        <div class="form-field">
          <div class="label-row-inline">
            <label class="form-label">Ruang Kerja <span class="optional">(Space)</span></label>
            <button
              type="button"
              class="create-space-inline-btn"
              @click="taskStore.openProjectModal()"
              title="Buat Ruang Kerja Baru"
            >
              + Space Baru
            </button>
          </div>
          <div class="select-wrapper">
            <select id="task-project-select" v-model="selectedProjectId" class="custom-select" :disabled="uploading">
              <option :value="null">-- Tanpa Ruang Kerja (Umum) --</option>
              <option v-for="proj in taskStore.projects" :key="proj.id" :value="proj.id">
                {{ proj.icon }} {{ proj.name }}
              </option>
            </select>
            <svg class="select-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <!-- Status Alur -->
        <div class="form-field">
          <label class="form-label">Status Alur</label>
          <div class="select-wrapper">
            <select id="task-status-select" v-model="selectedStatus" class="custom-select" :disabled="uploading">
              <option v-for="s in statusOptions" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
            <svg class="select-chevron" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <!-- Grid 2 Kolom: Batas Waktu & Estimasi Jam -->
      <div class="form-row-2col">
        <div class="form-field">
          <label class="form-label">Batas Waktu <span class="optional">(Deadline)</span></label>
          <div class="input-wrapper">
            <input
              id="task-due-date"
              v-model="dueDate"
              type="date"
              class="text-input date-input"
              :disabled="uploading"
            />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">Estimasi <span class="optional">(Jam)</span></label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <input
              id="task-estimate-input"
              v-model="estimatedHours"
              type="number"
              step="0.5"
              min="0"
              placeholder="cth: 2.5"
              class="text-input"
              :disabled="uploading"
            />
          </div>
        </div>
      </div>

      <!-- Tag / Label Input -->
      <div class="form-field">
        <label class="form-label">Tag / Label <span class="optional">(Tekan Enter)</span></label>
        <div class="input-wrapper">
          <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <input
            id="task-tag-input"
            v-model="tagInput"
            type="text"
            placeholder="frontend, bug..."
            class="text-input"
            :disabled="uploading"
            @keydown.enter.prevent="addTag"
            @keydown.,.prevent="addTag"
          />
        </div>
      </div>

      <!-- Tag Pills Container jika ada -->
      <div v-if="tags.length > 0" class="tags-container">
        <span v-for="(t, idx) in tags" :key="t" class="tag-pill">
          <span>#{{ t }}</span>
          <button type="button" class="tag-del-btn" @click="removeTag(idx)" title="Hapus tag">&times;</button>
        </span>
      </div>

      <!-- Multiple Files Uploader -->
      <div class="form-field">
        <div class="label-row">
          <label class="form-label">Lampiran Media & Dokumen <span class="optional">(Opsional)</span></label>
          <span v-if="selectedFiles.length > 0" class="files-count-badge">
            {{ selectedFiles.length }} file dipilih
          </span>
        </div>

        <!-- Drag and Drop Upload Area -->
        <label
          class="upload-area"
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onFileDrop"
        >
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            class="hidden-file-input"
            @change="onFileInputChange"
            :disabled="uploading"
          />
          <div class="upload-inner">
            <div class="upload-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </div>
            <div class="upload-text-group">
              <p class="upload-title">Pilih berkas atau seret ke sini</p>
              <p class="upload-hint">PNG, JPG, PDF, DOCX, ZIP hingga 15 MB</p>
            </div>
          </div>
        </label>

        <!-- Selected Files Preview List -->
        <div v-if="selectedFiles.length > 0" class="selected-files-grid">
          <div
            v-for="(item, index) in selectedFiles"
            :key="item.id"
            class="file-card"
            :class="{ 'is-private-card': item.isPrivate }"
          >
            <!-- Thumbnail / Icon -->
            <div class="file-thumb">
              <img v-if="item.previewUrl" :src="item.previewUrl" :alt="item.name" class="thumb-img" />
              <div v-else class="doc-icon" :class="getDocClass(item.name)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span class="file-ext">{{ getExt(item.name) }}</span>
              </div>
            </div>

            <!-- File Info -->
            <div class="file-details">
              <p class="file-name" :title="item.name">{{ item.name }}</p>
              <span class="file-size">{{ formatSize(item.size) }}</span>
            </div>

            <!-- Privacy Toggle & Remove -->
            <div class="file-options">
              <label class="private-toggle" title="File privat hanya bisa diakses via Signed URL">
                <input type="checkbox" v-model="item.isPrivate" :disabled="uploading" />
                <span class="private-label">Privat</span>
              </label>

              <button
                type="button"
                class="file-remove-btn"
                @click="removeFile(index)"
                :disabled="uploading"
                title="Hapus File"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Group -->
    <div class="form-bottom-actions">
      <!-- Divider -->
      <div class="form-divider"></div>

      <!-- Tombol Submit -->
      <button id="task-submit-btn" type="submit" class="submit-btn" :disabled="uploading || !localTaskText.trim()">
        <span v-if="uploading" class="spinner-container">
          <span class="spinner"></span>
          <span>Mengunggah & Menyimpan...</span>
        </span>
        <span v-else class="btn-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>Tambah Tugas</span>
        </span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import type { TaskFormSubmitPayload, SelectedUploadFile, TaskPriority, TaskStatus } from '~/types/task'

const taskStore = useTaskStore()

// Props
const props = defineProps<{
  uploading?: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'submit', payload: TaskFormSubmitPayload): void
}>()

// State lokal form
const localTaskText = ref<string>('')
const selectedPriority = ref<TaskPriority>('MEDIUM')
const selectedStatus = ref<TaskStatus>('TODO')
const selectedProjectId = ref<string | null>(taskStore.activeProjectId || null)
const dueDate = ref<string>('')
const estimatedHours = ref<number | null>(null)
const tags = ref<string[]>([])
const tagInput = ref<string>('')
const selectedFiles = ref<SelectedUploadFile[]>([])
const isDragging = ref<boolean>(false)

watch(
  () => taskStore.activeProjectId,
  (newProjId) => {
    selectedProjectId.value = newProjId || null
  }
)

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

const addTag = () => {
  const clean = tagInput.value.trim().replace(/^#/, '').toLowerCase()
  if (clean && !tags.value.includes(clean)) {
    tags.value.push(clean)
  }
  tagInput.value = ''
}

const removeTag = (index: number) => {
  tags.value.splice(index, 1)
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getExt = (name: string) => {
  return name.split('.').pop()?.toUpperCase() || 'FILE'
}

const getDocClass = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'doc' || ext === 'docx') return 'word'
  if (ext === 'zip' || ext === 'rar') return 'zip'
  return 'doc'
}

const addFiles = (fileList: FileList | File[]) => {
  Array.from(fileList).forEach(file => {
    let previewUrl: string | undefined
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file)
    }

    selectedFiles.value.push({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl,
      isPrivate: false
    })
  })
}

const onFileInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    addFiles(target.files)
  }
  target.value = ''
}

const onFileDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    addFiles(event.dataTransfer.files)
  }
}

const removeFile = (index: number) => {
  const item = selectedFiles.value[index]
  if (item?.previewUrl) {
    URL.revokeObjectURL(item.previewUrl)
  }
  selectedFiles.value.splice(index, 1)
}

const resetForm = () => {
  localTaskText.value = ''
  selectedPriority.value = 'MEDIUM'
  selectedStatus.value = 'TODO'
  selectedProjectId.value = taskStore.activeProjectId || null
  dueDate.value = ''
  estimatedHours.value = null
  tags.value = []
  tagInput.value = ''
  selectedFiles.value.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  })
  selectedFiles.value = []
}

const handleSubmit = () => {
  if (!localTaskText.value.trim()) return
  if (tagInput.value.trim()) {
    addTag()
  }
  emit('submit', {
    taskText: localTaskText.value.trim(),
    priority: selectedPriority.value,
    status: selectedStatus.value,
    projectId: selectedProjectId.value || null,
    dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : null,
    estimatedHours: estimatedHours.value ? Number(estimatedHours.value) : 0,
    tags: [...tags.value],
    files: [...selectedFiles.value]
  })
}

defineExpose({
  resetForm
})
</script>

<style scoped>
.task-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 380px;
  flex: 1;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.form-fields-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #f1f5f9;
}

.required {
  color: #f87171;
}

.optional {
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 400;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label-row-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-space-inline-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.15s ease;
}

.create-space-inline-btn:hover {
  color: #7dd3fc;
  text-decoration: underline;
}

.files-count-badge {
  font-size: 11px;
  color: #cbd5e1;
  background: #111726;
  border: 1px solid #1f2a3f;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

/* Input Teks */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.text-input {
  width: 100%;
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 10px 14px 10px 36px;
  color: #f1f5f9;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
}

.text-input:focus {
  border-color: #005afb;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.text-input::placeholder {
  color: #94a3b8;
}

/* Priority Selector */
.priority-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.priority-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 8px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.priority-btn:hover:not(:disabled) {
  border-color: #2d3b55;
  color: #f1f5f9;
}

.p-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-low .p-dot { background: #2dd4bf; }
.dot-medium .p-dot { background: #818cf8; }
.dot-high .p-dot { background: #fbbf24; }
.dot-urgent .p-dot { background: #f87171; }

.dot-low.active {
  background: rgba(45, 212, 191, 0.12);
  border-color: #2dd4bf;
  color: #5eead4;
}

.dot-medium.active {
  background: rgba(129, 140, 248, 0.12);
  border-color: #818cf8;
  color: #c7d2fe;
}

.dot-high.active {
  background: rgba(251, 191, 36, 0.12);
  border-color: #fbbf24;
  color: #fde68a;
}

.dot-urgent.active {
  background: rgba(248, 113, 113, 0.12);
  border-color: #f87171;
  color: #fca5a5;
}

/* 2-Column Responsive Row */
.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .form-row-2col {
    grid-template-columns: 1fr;
  }
  .priority-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Select Wrapper */
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.custom-select {
  width: 100%;
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 10px 32px 10px 14px;
  color: #f1f5f9;
  font-size: 13.5px;
  font-family: inherit;
  appearance: none;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.custom-select:focus {
  border-color: #005afb;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.select-chevron {
  position: absolute;
  right: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.date-input {
  color-scheme: dark;
  padding-left: 14px;
}

/* Tags Container */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: -6px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: #c7d2fe;
  font-size: 11.5px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
}

.tag-del-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0 2px;
  display: flex;
  align-items: center;
}

.tag-del-btn:hover {
  color: #f87171;
}

/* Upload Area Drag & Drop */
.upload-area {
  border: 1.5px dashed #2d3b55;
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  background: #090d16;
  transition: background 0.15s ease, border-color 0.15s ease;
  display: block;
}

.upload-area:hover,
.upload-area.is-dragging {
  border-color: #005afb;
  background: #0d1424;
}

.hidden-file-input {
  display: none;
}

.upload-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #111726;
  border: 1px solid #2d3b55;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.upload-text-group {
  flex: 1;
}

.upload-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.upload-hint {
  font-size: 12px;
  color: #cbd5e1;
  margin: 2px 0 0;
}

/* Selected Files Grid */
.selected-files-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #0d1422;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.file-card.is-private-card {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.3);
}

.file-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  background: #111726;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.doc-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
}

.doc-icon.pdf { color: #f87171; }
.doc-icon.word { color: #60a5fa; }
.doc-icon.zip { color: #fbbf24; }

.file-ext {
  font-size: 11px;
  font-weight: 800;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #94a3b8;
}

.file-options {
  display: flex;
  align-items: center;
  gap: 10px;
}

.private-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.private-toggle input {
  accent-color: #f59e0b;
  cursor: pointer;
}

.private-label {
  font-size: 11px;
  font-weight: 600;
  color: #fbbf24;
}

.file-remove-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.file-remove-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

/* Divider */
.form-divider {
  height: 1px;
  background: #1c273c;
  margin: 14px 0;
}

/* Submit Button */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 16px;
  background: #005afb;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  font-family: inherit;
}

.submit-btn:hover:not(:disabled) {
  background: #004ecc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-content,
.spinner-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

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
</style>
