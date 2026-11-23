<template>
  <div class="task-list-root">
    <!-- Loading State -->
    <div v-if="pending" class="table-status">
      <span class="pulse-spinner"></span>
      Memuat data tugas...
    </div>

    <!-- Empty State -->
    <div v-else-if="tasks.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
          <line x1="9" y1="9" x2="9" y2="21"></line>
        </svg>
      </div>
      <p class="empty-title">Belum ada tugas</p>
      <p class="empty-desc">{{ emptyHint || 'Tambahkan tugas pertama Anda untuk mulai mencatat pekerjaan.' }}</p>
      <button type="button" class="empty-cta" @click="emit('create')">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Tambah Tugas
      </button>
    </div>

    <!-- Daftar Tugas dengan Paginasi -->
    <div v-else class="table-wrapper">
      <div class="table-scroll-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-no">#</th>
              <th class="col-task">Tugas & Tag</th>
              <th class="col-priority">Prioritas</th>
              <th class="col-due">Tenggat</th>
              <th class="col-status">Status</th>
              <th class="col-img">Lampiran</th>
              <th class="col-action">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <TaskItem
              v-for="(task, index) in paginatedTasks"
              :key="task.id"
              :task="task"
              :index="(currentPage - 1) * pageSize + index + 1"
              @toggle="emit('toggle', $event)"
              @delete="emit('delete', $event)"
              @edit="emit('edit', $event)"
              @update-status="emit('update-status', $event)"
              @open-lightbox="emit('open-lightbox', $event)"
            />
          </tbody>
        </table>
      </div>

      <!-- Table Footer with Pagination Controls -->
      <div class="table-footer">
        <div class="footer-left">
          <span class="footer-info">
            Menampilkan <strong class="text-highlight">{{ itemRangeStart }}–{{ itemRangeEnd }}</strong> dari <strong class="text-highlight">{{ tasks.length }}</strong> tugas
          </span>
          <div class="footer-stats">
            <span class="stat-pill done">{{ completedCount }} Selesai</span>
            <span class="stat-pill active">{{ activeCount }} Aktif</span>
          </div>
        </div>

        <div class="footer-right">
          <!-- Page Size Selector -->
          <div class="page-size-selector">
            <span class="page-size-label">Baris:</span>
            <div class="page-size-group">
              <button
                v-for="size in pageSizeOptions"
                :key="size"
                type="button"
                class="size-pill-btn"
                :class="{ active: pageSize === size }"
                @click="setPageSize(size)"
                :title="`Tampilkan ${size} tugas per halaman`"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <!-- Pagination Navigation Buttons -->
          <div v-if="totalPages > 1" class="pagination-controls">
            <!-- Tombol Prev -->
            <button
              class="page-nav-btn"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
              title="Halaman Sebelumnya"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <!-- Nomor Halaman -->
            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-num-btn"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>

            <!-- Tombol Next -->
            <button
              class="page-nav-btn"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
              title="Halaman Berikutnya"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskEditPayload, TaskStatus } from '~/types/task'

// Props
const props = defineProps<{
  tasks: Task[]
  pending?: boolean
  emptyHint?: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'toggle', task: Task): void
  (e: 'delete', task: Task): void
  (e: 'edit', payload: { task: Task; payload: string | TaskEditPayload }): void
  (e: 'update-status', payload: { task: Task; status: TaskStatus }): void
  (e: 'open-lightbox', url: string): void
  (e: 'create'): void
}>()

// ─── PAGINATION LOGIC ─────────────────────────────────────────────────────────
const pageSizeOptions = [8, 10, 15, 20]
const pageSize = ref<number>(10)
const currentPage = ref<number>(1)

const totalPages = computed<number>(() => {
  return Math.ceil(props.tasks.length / pageSize.value) || 1
})

const visiblePages = computed<number[]>(() => {
  const max = 5
  const start = Math.max(1, Math.min(currentPage.value - Math.floor(max / 2), totalPages.value - max + 1))
  return Array.from({ length: Math.min(max, totalPages.value) }, (_, index) => start + index)
})

const paginatedTasks = computed<Task[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return props.tasks.slice(start, start + pageSize.value)
})

const itemRangeStart = computed<number>(() => {
  if (props.tasks.length === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const itemRangeEnd = computed<number>(() => {
  return Math.min(currentPage.value * pageSize.value, props.tasks.length)
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const setPageSize = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// Watcher untuk mereset atau menyesuaikan halaman jika data berkurang
watch(
  () => props.tasks.length,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  }
)

// Computed stats
const completedCount = computed<number>(() => props.tasks.filter((t: Task) => t.status === 'DONE').length)
const activeCount = computed<number>(() => props.tasks.filter((t: Task) => t.status !== 'DONE' && t.status !== 'ARCHIVED').length)
</script>

<style scoped>
.task-list-root {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Status / Loading */
.table-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 20px;
  color: var(--text-soft);
  font-size: 13.5px;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.pulse-spinner {
  width: 8px;
  height: 8px;
  background: var(--accent-primary, var(--accent-primary));
  border-radius: 50%;
  animation: pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.4); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  gap: 10px;
  min-height: 380px;
  flex: 1;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.empty-icon {
  width: 52px;
  height: 52px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-soft);
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 8px 14px;
  min-height: 36px;
  background: var(--accent-primary);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-control);
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.empty-cta:hover {
  background: #0047c7;
}

.empty-cta:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.35);
}

/* Table */
.table-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-height: 0;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.table-scroll-container {
  overflow-x: auto;
  flex: 1;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead tr {
  border-bottom: 1px solid var(--border-color);
  height: 44px;
  background: var(--bg-subtle);
}

.data-table tbody tr {
  height: 64px;
}

.data-table th {
  padding: 14px 18px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-soft);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.col-no       { width: 44px; }
.col-task     { min-width: 240px; }
.col-priority { width: 105px; }
.col-due      { width: 105px; }
.col-status   { width: 115px; }
.col-img      { width: 100px; }
.col-action   { width: 80px; text-align: center; }

/* Table Footer */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-subtle);
  flex-wrap: wrap;
  gap: 12px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-info {
  font-size: 12.5px;
  color: var(--text-soft);
}

.text-highlight {
  color: #f8fafc;
  font-weight: 600;
}

.footer-stats {
  display: flex;
  gap: 8px;
}

.stat-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-card);
}

.stat-pill.done {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.stat-pill.active {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

/* Footer Right: Page Size & Pagination */
.footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-size-label {
  font-size: 11.5px;
  color: var(--text-secondary);
  font-weight: 500;
}

.page-size-group {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-control);
  padding: 2px;
  gap: 2px;
}

.size-pill-btn {
  background: transparent;
  border: none;
  color: var(--text-soft);
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background 0.15s ease;
}

.size-pill-btn:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.size-pill-btn.active {
  background: #2563eb;
  color: #ffffff;
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-control);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.page-nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent-primary, var(--accent-primary));
  color: #ffffff;
}

.page-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-num-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-control);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  font-family: inherit;
}

.page-num-btn:hover:not(.active) {
  border-color: #2e3e5e;
  color: var(--text-primary);
}

.page-num-btn.active {
  background: var(--accent-primary, var(--accent-primary));
  border-color: var(--accent-primary, var(--accent-primary));
  color: #ffffff;
}

@media (max-width: 640px) {
  .table-footer {
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 12px 10px;
  }

  .footer-left {
    justify-content: center;
    width: 100%;
    gap: 12px;
  }

  .pagination-controls {
    justify-content: center;
    width: 100%;
  }
}

/* ─── MOBILE: tabel menjadi kartu bertumpuk (<= 720px) ───────────────────── */
@media (max-width: 720px) {
  .table-scroll-container {
    overflow: visible;
  }

  .data-table {
    display: block;
    width: 100%;
    font-size: 13px;
  }

  .data-table thead {
    display: none;
  }

  .data-table tbody {
    display: flex;
    flex-direction: column;
  }

  .data-table :deep(.table-row) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "task action"
      "priority due"
      "status img";
    align-items: center;
    gap: 8px 10px;
    height: auto;
    padding: 12px 14px;
    border-bottom: 1px solid var(--bg-hover);
  }

  .data-table :deep(.table-row:last-child) {
    border-bottom: none;
  }

  .data-table :deep(td) {
    display: block;
    width: auto;
    padding: 0;
    border: none;
  }

  .data-table :deep(.td-no) {
    display: none;
  }

  .data-table :deep(.td-task) {
    grid-area: task;
    min-width: 0;
    max-width: none;
  }

  .data-table :deep(.td-action) {
    grid-area: action;
    justify-self: end;
    text-align: right;
  }

  .data-table :deep(.td-priority) {
    grid-area: priority;
    justify-self: start;
  }

  .data-table :deep(.td-due) {
    grid-area: due;
    justify-self: end;
  }

  .data-table :deep(.td-status) {
    grid-area: status;
    justify-self: start;
  }

  .data-table :deep(.td-img) {
    grid-area: img;
    justify-self: end;
  }
}
</style>
