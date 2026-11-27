<template>
  <main class="page-content">
    <!-- Page Header -->
    <header class="page-header">
      <div class="page-heading">
        <h1 class="page-title">Tugas Saya</h1>
        <p class="page-summary">{{ summaryLine }}</p>
      </div>

      <div class="page-actions">
        <!-- Quick Input Bar for AI Natural Language Quick Add (Sprint 3) -->
        <div class="quick-input-wrapper">
          <button
            type="button"
            class="quick-input-btn"
            @click="openTemplateModal"
            title="Pilih template tugas atau tambahkan cepat via AI"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Quick Add</span>
          </button>
          <button
            id="open-composer-btn"
            type="button"
            class="primary-btn"
            :aria-expanded="composerOpen"
            aria-controls="task-composer"
            @click="toggleComposer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{{ composerOpen ? 'Tutup form' : 'Tambah Tugas' }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Composer (tertutup secara default) -->
    <section
      v-show="composerOpen"
      id="task-composer"
      class="content-card composer-card"
      aria-label="Tambah tugas baru"
    >
      <div class="card-header">
        <div class="card-title-group">
          <h2 class="card-title">Tugas Baru</h2>
          <span class="card-subtitle">Hanya nama yang wajib diisi</span>
        </div>
        <button
          type="button"
          class="icon-btn"
          aria-label="Tutup form tambah tugas"
          title="Tutup"
          @click="composerOpen = false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="card-body">
        <TaskForm ref="taskFormRef" :uploading="uploading" @submit="handleFormSubmit" />
      </div>
    </section>

    <!-- Filter Bar -->
    <div class="toolbar">
      <div class="filter-group" role="group" aria-label="Filter tugas">
        <button
          v-for="f in filterOptions"
          :key="f.value"
          type="button"
          class="filter-btn"
          :class="{ active: quickFilter === f.value }"
          :aria-pressed="quickFilter === f.value"
          @click="setFilter(f.value)"
        >
          <span>{{ f.label }}</span>
          <span class="filter-count">{{ f.count }}</span>
        </button>
      </div>

      <div class="toolbar-meta">
        <span
          v-if="activeProject"
          class="active-space-pill"
          :title="`Menampilkan tugas di ruang kerja: ${activeProject.name}`"
        >
          <span class="space-dot" :style="{ background: activeProject.color }"></span>
          <span class="active-space-name">{{ activeProject.name }}</span>
          <button
            type="button"
            class="clear-space-btn"
            @click.stop="taskStore.setActiveProject(null)"
            title="Hapus filter ruang kerja"
            aria-label="Hapus filter ruang kerja"
          >
            &times;
          </button>
        </span>
        <span class="result-count">{{ displayedTasks.length }} tugas</span>
      </div>
    </div>

    <!-- Card: Daftar Tugas -->
    <section class="content-card table-card">
      <div class="card-header">
        <div class="card-header-actions">
          <div class="view-switcher-group" role="group" aria-label="Pilih tampilan">
            <button
              type="button"
              class="view-switch-btn"
              :class="{ active: viewMode === 'table' }"
              :aria-pressed="viewMode === 'table'"
              @click="taskStore.setViewMode('table')"
              id="view-switch-table"
              title="Tampilan tabel"
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
              :aria-pressed="viewMode === 'kanban'"
              @click="taskStore.setViewMode('kanban')"
              id="view-switch-kanban"
              title="Tampilan papan kanban"
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
              :aria-pressed="viewMode === 'calendar'"
              @click="taskStore.setViewMode('calendar')"
              id="view-switch-calendar"
              title="Tampilan kalender"
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
        </div>
      </div>

      <div class="card-body no-padding">
        <div v-if="viewMode === 'table'" key="table" class="view-panel">
          <TaskList
            :tasks="displayedTasks"
            :pending="pending"
            :empty-hint="emptyHint"
            @toggle="handleToggleTask"
            @delete="handleDeleteTask"
            @edit="handleEditTask"
            @update-status="handleUpdateStatus"
            @open-lightbox="taskStore.openLightbox"
            @create="openComposer"
          />
        </div>
        <div v-else-if="viewMode === 'kanban'" key="kanban" class="view-panel">
          <KanbanBoard
            :tasks="displayedTasks"
            :pending="pending"
            @edit="handleEditTask"
            @delete="handleDeleteTask"
            @update-status="handleUpdateStatus"
          />
        </div>
        <div v-else-if="viewMode === 'calendar'" key="calendar" class="view-panel">
          <CalendarView
            :tasks="displayedTasks"
            :pending="pending"
            @update-due-date="handleUpdateDueDate"
          />
        </div>
      </div>
    </section>

    <!-- Sprint 3: Template Selection Modal -->
    <TaskTemplateModal />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTaskStore } from '~/stores/taskStore'
import TaskTemplateModal from '~/components/TaskTemplateModal.vue'
import type { Task, TaskFormSubmitPayload, TaskEditPayload, TaskStatus } from '~/types/task'

type QuickFilter = 'all' | 'active' | 'today' | 'overdue' | 'done'

definePageMeta({
  title: 'Dashboard'
})

// ─── Pinia Store ────────────────────────────────────────────────────────────
const taskStore = useTaskStore()
const {
  pending,
  uploading,
  viewMode,
  filteredTasks,
  activeProject,
  showTemplateModal
} = storeToRefs(taskStore)

// Fetch templates on mount
onMounted(() => {
  taskStore.fetchTemplates()
})

// ─── Route sync (sidebar links) ─────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

const validFilters: QuickFilter[] = ['all', 'active', 'today', 'overdue', 'done']
const filterFromQuery = (): QuickFilter => {
  const q = String(route.query.filter || '')
  return validFilters.includes(q as QuickFilter) ? (q as QuickFilter) : 'all'
}

const quickFilter = ref<QuickFilter>(filterFromQuery())

watch(
  () => route.query.filter,
  () => {
    quickFilter.value = filterFromQuery()
  }
)

const setFilter = (value: QuickFilter) => {
  quickFilter.value = value
  const query = { ...route.query }
  if (value === 'all') {
    delete query.filter
  } else {
    query.filter = value
  }
  router.replace({ query })
}

// ─── Filtering ──────────────────────────────────────────────────────────────
const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const dueTime = (task: Task): number | null => (task.due_date ? startOfDay(new Date(task.due_date)) : null)
const isDone = (task: Task): boolean => task.status === 'DONE'
const isArchived = (task: Task): boolean => task.status === 'ARCHIVED'

const isOverdue = (task: Task): boolean => {
  if (isDone(task) || isArchived(task)) return false
  const due = dueTime(task)
  return due !== null && due < startOfDay(new Date())
}

const isDueToday = (task: Task): boolean => {
  if (isDone(task) || isArchived(task)) return false
  const due = dueTime(task)
  return due !== null && due === startOfDay(new Date())
}

const visibleTasks = computed<Task[]>(() => filteredTasks.value)

const completedCount = computed(() => visibleTasks.value.filter(isDone).length)
const activeCount = computed(() => visibleTasks.value.filter(t => !isDone(t) && !isArchived(t)).length)
const overdueCount = computed(() => visibleTasks.value.filter(isOverdue).length)
const todayCount = computed(() => visibleTasks.value.filter(isDueToday).length)

const displayedTasks = computed<Task[]>(() => {
  switch (quickFilter.value) {
    case 'active':
      return visibleTasks.value.filter(t => !isDone(t) && !isArchived(t))
    case 'overdue':
      return visibleTasks.value.filter(isOverdue)
    case 'today':
      return visibleTasks.value.filter(isDueToday)
    case 'done':
      return visibleTasks.value.filter(isDone)
    default:
      return visibleTasks.value
  }
})

const filterOptions = computed(() => [
  { value: 'all' as QuickFilter, label: 'Semua', count: visibleTasks.value.length },
  { value: 'active' as QuickFilter, label: 'Aktif', count: activeCount.value },
  { value: 'today' as QuickFilter, label: 'Hari ini', count: todayCount.value },
  { value: 'overdue' as QuickFilter, label: 'Terlambat', count: overdueCount.value },
  { value: 'done' as QuickFilter, label: 'Selesai', count: completedCount.value }
])

const summaryLine = computed(() => {
  const parts = [`${visibleTasks.value.length} tugas`]
  if (overdueCount.value) parts.push(`${overdueCount.value} terlambat`)
  if (todayCount.value) parts.push(`${todayCount.value} jatuh tempo hari ini`)
  parts.push(`${completedCount.value} selesai`)
  return parts.join(' · ')
})

const emptyHint = computed(() => {
  if (quickFilter.value !== 'all') {
    return 'Tidak ada tugas yang cocok dengan filter ini. Pilih "Semua" untuk melihat seluruh tugas.'
  }
  return 'Tambahkan tugas pertama Anda untuk mulai mencatat pekerjaan.'
})

// ─── Composer ───────────────────────────────────────────────────────────────
const composerOpen = ref(false)
const taskFormRef = ref<{ resetForm: () => void } | null>(null)

const openTemplateModal = (): void => {
  taskStore.openTemplateModal()
}

// ─── Composer ───────────────────────────────────────────────────────────────
const openComposer = (): void => {
  composerOpen.value = true
  nextTick(() => {
    document.getElementById('task-title-input')?.focus()
  })
}

const toggleComposer = (): void => {
  if (composerOpen.value) {
    composerOpen.value = false
  } else {
    openComposer()
  }
}

// ─── Event Handlers ─────────────────────────────────────────────────────────
const handleFormSubmit = async (payload: TaskFormSubmitPayload): Promise<void> => {
  // PENTING: form hanya boleh direset bila store mengonfirmasi penyimpanan sukses.
  // Memeriksa flag `uploading` tidak cukup — flag itu selalu false setelah
  // `addTask` selesai, baik sukses maupun gagal.
  const saved = await taskStore.addTask(payload)
  if (saved) {
    taskFormRef.value?.resetForm()
    if (quickFilter.value === 'done') {
      setFilter('all')
    }
    nextTick(() => {
      document.getElementById('task-title-input')?.focus()
    })
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

// ─── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  await taskStore.fetchTasks()
})
</script>

<style scoped>
.page-content {
  flex: 1;
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-base);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-heading { min-width: 0; }
.page-title { margin: 0; font-size: 24px; line-height: 1.2; font-weight: 500; letter-spacing: -0.01em; color: var(--text-heading); }
.page-summary { margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.page-actions, .quick-input-wrapper { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.primary-btn, .quick-input-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 36px; padding: 0 14px; border-radius: var(--radius-control);
  font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
}
.primary-btn { background: var(--accent-primary); border: 1px solid var(--accent-primary); color: #fff; }
.primary-btn:hover { background: var(--accent-primary-hover); border-color: var(--accent-primary-hover); }
.quick-input-btn { background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-soft); }
.quick-input-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.primary-btn:focus-visible, .quick-input-btn:focus-visible, .filter-btn:focus-visible, .view-switch-btn:focus-visible, .icon-btn:focus-visible, .clear-space-btn:focus-visible {
  outline: none; box-shadow: 0 0 0 3px rgba(29,95,191,0.18);
}
.content-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-card); overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 16px; border-bottom: 1px solid var(--border-color); }
.card-title-group { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; min-width: 0; }
.card-title { margin: 0; font-size: 14px; font-weight: 500; color: var(--text-primary); }
.card-subtitle { font-size: 12px; color: var(--text-secondary); }
.card-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.card-body { padding: 16px; }
.card-body.no-padding { padding: 0; }
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;
  border-radius: var(--radius-control); border: 1px solid transparent; background: transparent; color: var(--text-secondary); cursor: pointer;
}
.icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.filter-group { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.filter-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px;
  border: 0; border-radius: var(--radius-control); background: transparent; color: var(--text-secondary);
  font-family: inherit; font-size: 13px; cursor: pointer;
}
.filter-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.filter-btn.active { background: var(--bg-active); color: var(--text-primary); font-weight: 500; }
.filter-count { font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.filter-btn.active .filter-count { color: var(--text-secondary); }
.toolbar-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.result-count { font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.active-space-pill {
  display: inline-flex; align-items: center; gap: 6px; max-width: 220px; padding: 3px 8px;
  border-radius: 999px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-soft); font-size: 12px;
}
.space-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.active-space-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clear-space-btn { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--text-muted); cursor: pointer; }
.clear-space-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.view-switcher-group { display: flex; align-items: center; gap: 2px; padding: 2px; border-radius: var(--radius-control); background: var(--bg-subtle); border: 1px solid var(--border-color); }
.view-switch-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; min-height: 30px;
  border: 0; border-radius: 5px; background: transparent; color: var(--text-secondary);
  font-family: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
}
.view-switch-btn:hover { color: var(--text-primary); }
.view-switch-btn.active { background: var(--bg-surface); color: var(--text-primary); }
.view-panel { min-width: 0; }
.table-card { min-height: 320px; }
@media (max-width: 900px) { .page-content { padding: 24px 16px; } .page-title { font-size: 22px; } }
@media (max-width: 720px) {
  .page-header, .toolbar { flex-direction: column; align-items: stretch; gap: 12px; }
  .page-actions, .page-actions .primary-btn, .quick-input-wrapper { width: 100%; }
  .page-actions .primary-btn, .quick-input-btn { flex: 1 1 0; }
  .filter-group { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
  .filter-group::-webkit-scrollbar { display: none; }
  .filter-btn { flex-shrink: 0; }
  .toolbar-meta, .card-header-actions { justify-content: space-between; }
  .card-header { padding: 12px 14px; }
  .card-body { padding: 14px; }
  .view-switch-btn span { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .primary-btn, .quick-input-btn, .filter-btn, .view-switch-btn, .icon-btn, .clear-space-btn { transition: none; }
}
</style>
