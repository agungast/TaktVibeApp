<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="taskStore.showAttachmentModal && taskStore.selectedTaskForAttachments" class="modal-backdrop" @click.self="taskStore.closeAttachmentModal">
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-title-wrap">
              <div class="header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Manajemen Lampiran</h3>
                <p class="modal-subtitle">"{{ taskStore.selectedTaskForAttachments.title }}"</p>
              </div>
            </div>
            <button class="close-btn" @click="taskStore.closeAttachmentModal" title="Tutup">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Body: Attachment List -->
          <div class="modal-body">
            <!-- List existing attachments -->
            <div v-if="attachments.length > 0" class="attachment-list">
              <div
                v-for="att in attachments"
                :key="att.id"
                class="attachment-card"
                :class="{ 'is-private': att.is_private }"
              >
                <!-- Thumbnail / Icon -->
                <div class="att-thumb-wrap" @click="handlePreview(att)">
                  <img
                    v-if="isImage(att.file_type)"
                    :src="taskStore.getThumbnailUrl(att.file_path, 100, 100)"
                    :alt="att.file_name"
                    class="att-thumb-img"
                  />
                  <div v-else class="att-doc-icon" :class="getDocTypeClass(att.file_name)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span class="ext-badge">{{ getFileExt(att.file_name) }}</span>
                  </div>
                </div>

                <!-- Info -->
                <div class="att-info">
                  <div class="att-title-row">
                    <span class="att-name" :title="att.file_name">{{ att.file_name }}</span>
                    <span v-if="att.is_private" class="privacy-badge private" title="File privat, akses dilindungi Signed URL">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Privat
                    </span>
                    <span v-else class="privacy-badge public" title="File publik">Publik</span>
                  </div>
                  <div class="att-meta">
                    <span>{{ taskStore.formatFileSize(att.file_size) }}</span>
                    <span>•</span>
                    <span>{{ taskStore.formatBackupDate(att.created_at) }}</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="att-actions">
                  <button
                    class="action-btn download"
                    @click="taskStore.downloadAttachment(att)"
                    :title="att.is_private ? 'Unduh file privat (Signed URL)' : 'Unduh file'"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                  <button
                    class="action-btn delete"
                    @click="handleDelete(att)"
                    title="Hapus Lampiran"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="empty-attachments">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
              <p>Belum ada lampiran pada tugas ini.</p>
            </div>

            <!-- Add new attachments section -->
            <div class="add-section">
              <h4 class="add-title">Tambah Lampiran Baru</h4>
              
              <!-- Dropzone -->
              <label class="dropzone">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                  class="hidden-file-input"
                  @change="handleSelectFiles"
                  :disabled="taskStore.uploading"
                />
                <div class="dropzone-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 16 12 12 8 16"></polyline>
                    <line x1="12" y1="12" x2="12" y2="21"></line>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                  </svg>
                  <span>Pilih atau seret file ke sini (Gambar, PDF, Dokumen)</span>
                </div>
              </label>

              <!-- Selected files preview before uploading -->
              <div v-if="newFiles.length > 0" class="new-files-list">
                <div v-for="(f, i) in newFiles" :key="f.id" class="new-file-item">
                  <span class="new-file-name" :title="f.name">{{ f.name }}</span>
                  <span class="new-file-size">{{ taskStore.formatFileSize(f.size) }}</span>
                  
                  <label class="private-checkbox" title="Tandai sebagai dokumen rahasia/privat (dilindungi Signed URL)">
                    <input type="checkbox" v-model="f.isPrivate" />
                    <span>Privat</span>
                  </label>

                  <button class="remove-new-btn" @click="removeNewFile(i)">×</button>
                </div>

                <button
                  class="upload-now-btn"
                  @click="handleUploadNewFiles"
                  :disabled="taskStore.uploading"
                >
                  <span v-if="taskStore.uploading" class="spinner"></span>
                  <span>{{ taskStore.uploading ? 'Mengunggah...' : `Unggah ${newFiles.length} File` }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import type { TaskAttachment, SelectedUploadFile, LightboxMediaItem } from '~/types/task'

const taskStore = useTaskStore()

const newFiles = ref<SelectedUploadFile[]>([])

const attachments = computed<TaskAttachment[]>(() => {
  return taskStore.selectedTaskForAttachments?.task_attachments || []
})

const isImage = (mimeType: string) => {
  return mimeType.startsWith('image/')
}

const getFileExt = (fileName: string) => {
  return fileName.split('.').pop()?.toUpperCase() || 'FILE'
}

const getDocTypeClass = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf-doc'
  if (ext === 'doc' || ext === 'docx') return 'word-doc'
  if (ext === 'zip' || ext === 'rar') return 'zip-doc'
  return 'generic-doc'
}

const handlePreview = (att: TaskAttachment) => {
  if (isImage(att.file_type)) {
    const images: LightboxMediaItem[] = attachments.value
      .filter(a => isImage(a.file_type))
      .map(a => ({
        url: a.is_private ? a.file_path : taskStore.getPublicOriginalUrl(a.file_path),
        title: a.file_name,
        fileName: a.file_name,
        isPrivate: a.is_private
      }))

    const startIdx = images.findIndex(img => img.fileName === att.file_name)
    taskStore.openLightboxGallery(images, Math.max(0, startIdx))
  } else {
    taskStore.downloadAttachment(att)
  }
}

const handleDelete = async (att: TaskAttachment) => {
  if (confirm(`Hapus lampiran "${att.file_name}"?`)) {
    await taskStore.deleteAttachment(att)
  }
}

const handleSelectFiles = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  Array.from(target.files).forEach(file => {
    let previewUrl: string | undefined
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file)
    }

    newFiles.value.push({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl,
      isPrivate: false
    })
  })

  target.value = ''
}

const removeNewFile = (idx: number) => {
  const f = newFiles.value[idx]
  if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl)
  newFiles.value.splice(idx, 1)
}

const handleUploadNewFiles = async () => {
  if (!taskStore.selectedTaskForAttachments || newFiles.value.length === 0) return
  const success = await taskStore.addAttachmentsToTask(
    taskStore.selectedTaskForAttachments.id,
    newFiles.value
  )
  if (success) {
    newFiles.value.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
    })
    newFiles.value = []
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.modal-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #334155;
  background: rgba(15, 23, 42, 0.6);
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #818cf8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

.modal-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
  max-width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.modal-body {
  padding: 20px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Attachment list */
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  transition: border-color 0.15s ease;
}

.attachment-card:hover {
  border-color: #475569;
}

.attachment-card.is-private {
  background: rgba(245, 158, 11, 0.05);
}

.att-thumb-wrap {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}

.att-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.att-doc-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #94a3b8;
  position: relative;
}

.pdf-doc { color: #f87171; }
.word-doc { color: #60a5fa; }
.zip-doc { color: #fbbf24; }

.ext-badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  margin-top: 1px;
}

.att-info {
  flex: 1;
  min-width: 0;
}

.att-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.att-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-ext {
  font-size: 11px;
  font-weight: 800;
}

.file-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.privacy-badge {
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.privacy-badge.private {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.privacy-badge.public {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.att-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.att-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn.download {
  color: #818cf8;
}

.action-btn.download:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

.action-btn.delete {
  color: #94a3b8;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* Empty */
.empty-attachments {
  text-align: center;
  padding: 24px;
  background: #0f172a;
  border: 1px dashed #334155;
  border-radius: 10px;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

/* Add Section */
.add-section {
  border-top: 1px solid #334155;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-title {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  margin: 0;
}

.dropzone {
  display: block;
  border: 1px dashed #475569;
  border-radius: 9px;
  padding: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #0f172a;
}

.dropzone:hover {
  border-color: #005afb;
  background: rgba(0, 90, 251, 0.05);
}

.dropzone-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.hidden-file-input {
  display: none;
}

/* New files list */
.new-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 7px;
  font-size: 12px;
}

.new-file-name {
  color: #f1f5f9;
  font-weight: 500;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.new-file-size {
  color: #94a3b8;
  font-size: 11px;
}

.private-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #fbbf24;
  cursor: pointer;
}

.remove-new-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
}

.remove-new-btn:hover {
  color: #f87171;
}

.upload-now-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px;
  background: linear-gradient(135deg, #005afb, #6120f7);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 4px;
}

.upload-now-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.upload-now-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
