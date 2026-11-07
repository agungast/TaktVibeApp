<template>
  <div class="kanban-wrapper" id="kanban-board-root">
    <!-- Loading State -->
    <div v-if="pending" class="kanban-grid">
      <div v-for="col in columnDefinitions" :key="col.status" class="kanban-column skeleton-column">
        <div class="column-header">
          <div class="column-title-wrap">
            <span class="column-dot" :class="col.dotClass"></span>
            <span class="column-title">{{ col.label }}</span>
          </div>
          <span class="column-count-badge">...</span>
        </div>
        <div class="column-cards-body">
          <div class="skeleton-card"></div>
          <div class="skeleton-card short"></div>
        </div>
      </div>
    </div>

    <!-- Kanban Columns Grid -->
    <div v-else class="kanban-grid">
      <div
        v-for="col in populatedColumns"
        :key="col.status"
        class="kanban-column"
        :class="{ 'is-drag-over': dragOverColumn === col.status }"
        :id="`kanban-col-${col.status.toLowerCase()}`"
        @dragover.prevent="onDragOver(col.status)"
        @dragenter.prevent="onDragEnter(col.status)"
        @dragleave="onDragLeave(col.status, $event)"
        @drop="onDrop(col.status, $event)"
      >
        <!-- Column Header -->
        <div class="column-header">
          <div class="column-title-wrap">
            <span class="column-dot" :class="col.dotClass"></span>
            <span class="column-title">{{ col.label }}</span>
          </div>
          <span class="column-count-badge" :class="{ 'has-items': col.tasks.length > 0 }">
            {{ col.tasks.length }}
          </span>
        </div>

        <!-- Cards Container (Dropzone) -->
        <div class="column-cards-body">
          <!-- Empty Dropzone State -->
          <div v-if="col.tasks.length === 0" class="empty-dropzone">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>Tarik tugas ke sini</span>
          </div>

          <!-- Cards List -->
          <TransitionGroup v-else name="card-list" tag="div" class="cards-stack">
            <KanbanCard
              v-for="task in col.tasks"
              :key="task.id"
              :task="task"
              @edit="emit('edit', $event)"
              @delete="emit('delete', $event)"
              @update-status="emit('update-status', $event)"
            />
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskStatus, TaskEditPayload } from '~/types/task'

const props = defineProps<{
  tasks: Task[]
  pending?: boolean
}>()

const emit = defineEmits<{
  edit: [payload: { task: Task; payload: string | TaskEditPayload }]
  delete: [task: Task]
  'update-status': [payload: { task: Task; status: TaskStatus }]
}>()

interface ColumnDefinition {
  status: TaskStatus
  label: string
  dotClass: string
}

const columnDefinitions: ColumnDefinition[] = [
  { status: 'BACKLOG', label: 'Backlog', dotClass: 'dot-backlog' },
  { status: 'TODO', label: 'To Do', dotClass: 'dot-todo' },
  { status: 'IN_PROGRESS', label: 'In Progress', dotClass: 'dot-progress' },
  { status: 'DONE', label: 'Done', dotClass: 'dot-done' }
]

const populatedColumns = computed(() => {
  const list = Array.isArray(props.tasks) ? props.tasks : []
  return columnDefinitions.map(def => {
    const colTasks = list.filter(t => {
      if (!t) return false
      const s = t.status || (t.is_completed ? 'DONE' : 'TODO')
      return s === def.status
    })
    return {
      ...def,
      tasks: colTasks
    }
  })
})

// ─── Drag & Drop Handling ────────────────────────────────────────────────────
const dragOverColumn = ref<TaskStatus | null>(null)

const onDragOver = (status: TaskStatus) => {
  dragOverColumn.value = status
}

const onDragEnter = (status: TaskStatus) => {
  dragOverColumn.value = status
}

const onDragLeave = (status: TaskStatus, event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement
  if (!currentTarget.contains(relatedTarget)) {
    if (dragOverColumn.value === status) {
      dragOverColumn.value = null
    }
  }
}

const onDrop = (targetStatus: TaskStatus, event: DragEvent) => {
  dragOverColumn.value = null
  const taskId = event.dataTransfer?.getData('text/plain')
  if (!taskId) return

  const list = Array.isArray(props.tasks) ? props.tasks : []
  const targetTask = list.find(t => t && String(t.id) === String(taskId))
  if (targetTask) {
    const currentStatus = targetTask.status || (targetTask.is_completed ? 'DONE' : 'TODO')
    if (currentStatus !== targetStatus) {
      emit('update-status', { task: targetTask, status: targetStatus })
    }
  }
}
</script>

<style scoped>
.kanban-wrapper {
  width: 100%;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: auto;
  padding: 16px 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: #1f2a3f #090d16;
}

.kanban-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 16px;
  min-width: 1080px;
}

.kanban-column {
  background: #090d16;
  border: 1px solid #172136;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-height: 480px;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.kanban-column.is-drag-over {
  border-color: #005afb;
  background: #0d1424;
}

/* Column Header */
.column-header {
  padding: 14px 14px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #172136;
}

.column-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-backlog { background: #94a3b8; }
.dot-todo { background: #60a5fa; }
.dot-progress { background: #fbbf24; }
.dot-done { background: #4ade80; }

.column-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: 0.01em;
}

.column-count-badge {
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
  background: #111726;
  border: 1px solid #1f2a3f;
  padding: 1px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.column-count-badge.has-items {
  color: #cbd5e1;
}

/* Cards Stack */
.column-cards-body {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

/* Empty Dropzone */
.empty-dropzone {
  border: 1px dashed #1f2a3f;
  border-radius: 8px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.kanban-column.is-drag-over .empty-dropzone {
  border-color: #005afb;
  color: #93c5fd;
  background: rgba(79, 70, 229, 0.04);
}

/* Skeleton Loading */
.skeleton-column {
  opacity: 0.6;
}

.skeleton-card {
  height: 90px;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  margin-bottom: 10px;
  animation: pulse-skeleton 1.5s ease-in-out infinite;
}

.skeleton-card.short {
  height: 70px;
}

@keyframes pulse-skeleton {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* Transition Group Animations */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.card-list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
