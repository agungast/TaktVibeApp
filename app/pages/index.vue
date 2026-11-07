<template>
  <main class="page-content">
    <!-- Executive Segmented Metric Header -->
    <div class="metrics-container">
      <div class="metric-segment">
        <div class="metric-top">
          <span class="metric-label">Total Tugas</span>
          <span class="metric-dot-indicator total"></span>
        </div>
        <div class="metric-main">
          <span class="metric-value">{{ tasks.length }}</span>
          <span class="metric-unit">tugas terdaftar</span>
        </div>
      </div>

      <div class="metric-segment">
        <div class="metric-top">
          <span class="metric-label">Tugas Selesai</span>
          <span class="metric-pill success">{{ completedCount }} selesai</span>
        </div>
        <div class="metric-main">
          <span class="metric-value text-success">{{ completedCount }}</span>
          <span class="metric-sub">{{ tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0 }}% rasio</span>
        </div>
      </div>

      <div class="metric-segment">
        <div class="metric-top">
          <span class="metric-label">Tugas Aktif</span>
          <span class="metric-pill warning">{{ activeCount }} aktif</span>
        </div>
        <div class="metric-main">
          <span class="metric-value text-warning">{{ activeCount }}</span>
          <span class="metric-sub">perlu diselesaikan</span>
        </div>
      </div>

      <div class="metric-segment progress-segment">
        <div class="metric-top">
          <span class="metric-label">Tingkat Penyelesaian</span>
          <span class="metric-pct-badge">{{ progressPercent }}%</span>
        </div>
        <div class="metric-progress-wrapper">
          <div class="metric-progress-track">
            <div class="metric-progress-fill" :style="{ transform: `scaleX(${progressPercent / 100})` }"></div>
          </div>
          <span class="metric-progress-caption">{{ completedCount }} dari {{ tasks.length }} tugas rampung</span>
        </div>
      </div>
    </div>

    <!-- Form + Task List -->
    <div class="content-grid">
      <!-- Card: Tambah Tugas -->
      <div class="content-card form-card">
        <div class="card-header">
          <div class="card-title-group">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <h2 class="card-title">Tambah Tugas Baru</h2>
          </div>
        </div>
        <div class="card-body">
          <TaskForm ref="taskFormRef" :uploading="uploading" @submit="handleFormSubmit" />
        </div>
      </div>

      <!-- Card: Daftar Tugas -->
      <div class="content-card table-card">
        <div class="card-header">
          <div class="card-title-group">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
              <line x1="9" y1="9" x2="9" y2="21"></line>
            </svg>
            <h2 class="card-title">Daftar Tugas</h2>
            <span
              v-if="activeProject"
              class="active-space-pill"
              :style="{ color: activeProject.color, borderColor: `${activeProject.color}40`, background: `${activeProject.color}15` }"
              :title="`Menampilkan tugas di ruang kerja: ${activeProject.name}`"
            >
              <span class="active-space-icon">{{ activeProject.icon }}</span>
              <span class="active-space-name">{{ activeProject.name }}</span>
              <button
                type="button"
                class="clear-space-btn"
                @click.stop="taskStore.setActiveProject(null)"
                title="Hapus filter ruang kerja"
              >
                &times;
              </button>
            </span>
          </div>
          <div class="card-header-actions">
            <!-- Segmented View Switcher: Tabel vs Kanban -->
            <div class="view-switcher-group" role="group" aria-label="Pilih Tampilan">
              <button
                type="button"
                class="view-switch-btn"
                :class="{ active: viewMode === 'table' }"
                @click="taskStore.setViewMode('table')"
                id="view-switch-table"
                title="Tampilan Tabel Data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="3" y1="15" x2="21" y2="15"></line>
                  <line x1="9" y1="9" x2="9" y2="21"></line>
                </svg>
                <span>Tabel</span>
              </button>
              <button
                type="button"
                class="view-switch-btn"
                :class="{ active: viewMode === 'kanban' }"
                @click="taskStore.setViewMode('kanban')"
                id="view-switch-kanban"
                title="Tampilan Papan Kanban"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                </svg>
                <span>Kanban</span>
              </button>
              <button
                type="button"
                class="view-switch-btn"
                :class="{ active: viewMode === 'calendar' }"
                @click="taskStore.setViewMode('calendar')"
                id="view-switch-calendar"
                title="Tampilan Kalender & Jadwal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Kalender</span>
              </button>
            </div>

            <span class="card-badge">{{ filteredTasks.length }} tugas</span>
            <!-- Tombol Download Backup -->
            <div class="backup-menu-wrap" ref="backupMenuRef">
              <button
                class="backup-btn"
                @click="taskStore.toggleBackupMenu"
                :disabled="backupLoading"
                title="Download Backup CSV"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {{ backupLoading ? 'Memuat...' : 'Backup CSV' }}
              </button>

              <!-- Dropdown daftar backup -->
              <div v-if="showBackupMenu" class="backup-dropdown">
                <div class="backup-dropdown-header">File Backup Tersedia</div>
                <div v-if="backupLoading" class="backup-loading">
                  <span class="pulse-dot"></span> Memuat daftar...
                </div>
                <div v-else-if="latestBackups.length === 0" class="backup-empty">
                  Belum ada file backup.<br/>
                  <span class="backup-hint">Jalankan Edge Function terlebih dahulu.</span>
                </div>
                <ul v-else class="backup-list">
                  <li
                    v-for="file in latestBackups"
                    :key="file.name"
                    class="backup-item"
                    @click="taskStore.downloadBackup(file.name)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <div class="backup-item-info">
                      <span class="backup-item-name">{{ file.name }}</span>
                      <span class="backup-item-meta">{{ taskStore.formatBackupDate(file.created_at) }} · {{ taskStore.formatFileSize(file.size_bytes) }}</span>
                    </div>
                    <svg class="backup-item-dl" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="card-body no-padding">
          <div v-if="viewMode === 'table'" key="table" class="view-panel">
            <TaskList
              :tasks="filteredTasks"
              :pending="pending"
              @toggle="handleToggleTask"
              @delete="handleDeleteTask"
              @edit="handleEditTask"
              @update-status="handleUpdateStatus"
              @open-lightbox="taskStore.openLightbox"
            />
          </div>
          <div v-else-if="viewMode === 'kanban'" key="kanban" class="view-panel">
            <KanbanBoard
              :tasks="filteredTasks"
              :pending="pending"
              @edit="handleEditTask"
              @delete="handleDeleteTask"
              @update-status="handleUpdateStatus"
            />
          </div>
          <div v-else-if="viewMode === 'calendar'" key="calendar" class="view-panel">
            <CalendarView
              :tasks="filteredTasks"
              :pending="pending"
              @update-due-date="handleUpdateDueDate"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Log Card -->
    <div class="content-card activity-card">
      <div class="card-header">
        <div class="card-title-group">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h2 class="card-title">Realtime Activity Feed</h2>
        </div>
        <div class="realtime-status-pill" :class="{ connected: isRealtimeConnected }">
          <span class="realtime-dot" :class="{ connected: isRealtimeConnected }"></span>
          <span>{{ isRealtimeConnected ? 'Live Realtime' : 'Menghubungkan...' }}</span>
        </div>
      </div>
      <div class="card-body activity-body">
        <div v-if="activityLogs.length === 0" class="log-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>Menunggu aktivitas realtime...</p>
        </div>
        <TransitionGroup name="log-list" tag="ul" class="log-list">
          <li v-for="log in activityLogs" :key="log.id" class="log-item">
            <span class="log-badge" :class="log.type">
              {{ log.type === 'INSERT' ? 'BARU' : log.type === 'DELETE' ? 'HAPUS' : 'UPDATE' }}
            </span>
            <div class="log-content">
              <span class="log-task">{{ log.task }}</span>
              <span class="log-time">{{ log.time }}</span>
            </div>
          </li>
        </TransitionGroup>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import type { Task, TaskFormSubmitPayload, TaskEditPayload, TaskStatus } from '~/types/task'

// ─── Pinia Store ────────────────────────────────────────────────────────────
const taskStore = useTaskStore()
const {
  tasks,
  pending,
  uploading,
  latestBackups,
  backupLoading,
  showBackupMenu,
  activityLogs,
  isRealtimeConnected,
  cronStatus,
  cronLoading,
  completedCount,
  activeCount,
  progressPercent,
  viewMode,
  filteredTasks,
  activeProject
} = storeToRefs(taskStore)

// ─── Template Refs ──────────────────────────────────────────────────────────
const taskFormRef = ref<{ resetForm: () => void } | null>(null)
const backupMenuRef = ref<HTMLDivElement | null>(null)

// ─── Event Handlers ─────────────────────────────────────────────────────────
const handleFormSubmit = async (payload: TaskFormSubmitPayload): Promise<void> => {
  await taskStore.addTask(payload)
  if (!taskStore.uploading) {
    taskFormRef.value?.resetForm()
  }
}

const handleToggleTask = (task: Task): void => {
  taskStore.toggleTask(task)
}

const handleUpdateStatus = ({ task, status }: { task: Task; status: TaskStatus }): void => {
  taskStore.updateTaskStatus(task, status)
}

const handleEditTask = ({ task, payload }: { task: Task; payload: string | TaskEditPayload }): void => {
  taskStore.editTask(task, payload)
}

const handleDeleteTask = (task: Task): void => {
  taskStore.deleteTask(task)
}

const handleUpdateDueDate = ({ task, dueDate }: { task: Task; dueDate: string | null }): void => {
  taskStore.updateTaskDueDate(task, dueDate)
}

const handleOutsideClick = (e: MouseEvent): void => {
  if (backupMenuRef.value && !backupMenuRef.value.contains(e.target as Node)) {
    taskStore.closeBackupMenu()
  }
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  await taskStore.fetchTasks()
  await taskStore.fetchCronStatus()
  document.addEventListener('click', handleOutsideClick)
  taskStore.initRealtime()
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
/* ─── PAGE CONTENT ────────────────────────────────────────────────────────── */
.page-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--bg-base, #090d16);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ─── EXECUTIVE BENTO METRIC HEADER ───────────────────────────────────────── */
.metrics-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #0f172a;
  border: 1px solid #1f2a3f;
  border-radius: 12px;
  overflow: hidden;
}

.metric-segment {
  padding: 16px 20px;
  border-right: 1px solid #1f2a3f;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  transition: background 0.15s ease;
}

.metric-segment:last-child {
  border-right: none;
}

.metric-segment:hover {
  background: #111a2f;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.metric-dot-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3b82f6;
}

.metric-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
}

.metric-pill.success {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.metric-pill.warning {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.metric-pct-badge {
  font-size: 12px;
  font-weight: 700;
  color: #f1f5f9;
  background: #1e293b;
  border: 1px solid #2e3e5e;
  padding: 2px 8px;
  border-radius: 6px;
}

.metric-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.metric-value {
  font-size: 26px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1;
  letter-spacing: -0.02em;
}

.metric-value.text-success {
  color: #4ade80;
}

.metric-value.text-warning {
  color: #fbbf24;
}

.metric-unit {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.metric-sub {
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 500;
}

/* Progress Segment */
.metric-progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-progress-track {
  height: 6px;
  background: #1e293b;
  border-radius: 999px;
  overflow: hidden;
}

.metric-progress-fill {
  width: 100%;
  height: 100%;
  background: var(--accent-gradient, linear-gradient(135deg, #005afb, #6120f7));
  border-radius: 999px;
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.metric-progress-caption {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* ─── CONTENT GRID ────────────────────────────────────────────────────────── */
.content-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: stretch;
}

/* ─── CARD ────────────────────────────────────────────────────────────────── */
.content-card {
  background: #0f172a;
  border: 1px solid #1f2a3f;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #1f2a3f;
  background: #0d1422;
  flex-shrink: 0;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #cbd5e1;
}

.card-title {
  font-size: 14.5px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: -0.01em;
}

.active-space-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid;
  font-size: 11.5px;
  font-weight: 550;
  margin-left: 4px;
}

.active-space-icon {
  font-size: 11.5px;
  line-height: 1;
}

.active-space-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-space-btn {
  background: none;
  border: none;
  color: currentColor;
  opacity: 0.7;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.clear-space-btn:hover {
  opacity: 1;
}

.card-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ─── SEGMENTED VIEW SWITCHER ─────────────────────────────────────────────── */
.view-switcher-group {
  display: inline-flex;
  align-items: center;
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.view-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.view-switch-btn:hover:not(.active) {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.03);
}

.view-switch-btn.active {
  color: #f1f5f9;
  background: #172136;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.view-switch-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.4);
}

/* ─── VIEW PANEL ANIMATION ────────────────────────────────────────────────── */
.view-panel {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: viewPanelFade 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes viewPanelFade {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-badge {
  font-size: 11.5px;
  font-weight: 600;
  color: #cbd5e1;
  background: #111726;
  border: 1px solid #1f2a3f;
  padding: 3px 9px;
  border-radius: 12px;
}

.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-body.no-padding {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ─── BACKUP MENU ─────────────────────────────────────────────────────────── */
.backup-menu-wrap {
  position: relative;
}

.backup-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #2d3b55;
  background: #111726;
  color: #f1f5f9;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  font-family: inherit;
}

.backup-btn:hover:not(:disabled) {
  background: #172136;
  border-color: var(--accent-primary, #005afb);
  color: #ffffff;
}

.backup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.backup-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 270px;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
  z-index: 50;
  overflow: hidden;
}

.backup-dropdown-header {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #1f2a3f;
  background: #0d1422;
}

.backup-loading, .backup-empty {
  padding: 16px 14px;
  font-size: 12px;
  color: #cbd5e1;
  text-align: center;
}

.backup-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}

.backup-list {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.backup-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #cbd5e1;
  transition: background 0.15s ease;
}

.backup-item:hover {
  background: #172136;
  color: #f1f5f9;
}

.backup-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.backup-item-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.backup-item-meta {
  font-size: 11.5px;
  color: #94a3b8;
}

.backup-item-dl {
  color: #cbd5e1;
  opacity: 0.7;
}

.backup-item:hover .backup-item-dl {
  opacity: 1;
  color: #ffffff;
}

/* ─── ACTIVITY LOG ────────────────────────────────────────────────────────── */
.realtime-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
  background: #111726;
  border: 1px solid #1f2a3f;
  padding: 3px 9px;
  border-radius: 12px;
}

.realtime-status-pill.connected {
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.25);
}

.realtime-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #64748b;
  flex-shrink: 0;
  position: relative;
}

.realtime-dot.connected {
  background: #22c55e;
}

.realtime-dot.connected::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1.5px solid rgba(34, 197, 94, 0.5);
  animation: radar-ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes radar-ping {
  0% { transform: scale(1); opacity: 0.9; }
  100% { transform: scale(2.4); opacity: 0; }
}

.activity-body {
  padding: 0 !important;
  max-height: 280px;
  overflow-y: auto;
}

.log-empty {
  padding: 32px 16px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  border-bottom: 1px solid #172136;
  transition: background 0.15s ease;
}

.log-item:hover {
  background: #0d1422;
}

.log-item:last-child {
  border-bottom: none;
}

.log-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.log-badge.INSERT { background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.25); }
.log-badge.UPDATE { background: rgba(79, 70, 229, 0.12); color: #a5b4fc; border: 1px solid rgba(79, 70, 229, 0.25); }
.log-badge.DELETE { background: rgba(239, 68, 68, 0.12); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.25); }

.log-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.log-task {
  font-size: 13px;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.log-time {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

/* ─── RESPONSIVE ──────────────────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .metrics-container {
    grid-template-columns: repeat(2, 1fr);
  }
  .metric-segment {
    border-bottom: 1px solid #1f2a3f;
  }
}

@media (max-width: 640px) {
  .page-content {
    padding: 16px;
  }

  .metrics-container {
    grid-template-columns: 1fr;
  }
}
</style>
