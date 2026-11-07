<template>
  <div class="calendar-root">
    <!-- Calendar Top Control Bar -->
    <div class="cal-control-bar">
      <!-- Month/Week Navigation Group -->
      <div class="nav-cluster">
        <div class="nav-buttons">
          <button
            type="button"
            class="cal-nav-btn"
            @click="navigate(-1)"
            :title="calMode === 'month' ? 'Bulan Sebelumnya' : 'Minggu Sebelumnya'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            type="button"
            class="cal-today-btn"
            @click="jumpToToday"
            title="Kembali ke Hari Ini"
          >
            Hari Ini
          </button>
          <button
            type="button"
            class="cal-nav-btn"
            @click="navigate(1)"
            :title="calMode === 'month' ? 'Bulan Berikutnya' : 'Minggu Berikutnya'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <h3 class="current-period-title">
          {{ periodTitle }}
        </h3>
      </div>

      <!-- Right Controls: Mode Switcher & Unscheduled Tray Toggle -->
      <div class="cal-action-cluster">
        <!-- Segmented Mode: Bulan vs Minggu -->
        <div class="cal-mode-switcher">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: calMode === 'month' }"
            @click="calMode = 'month'"
          >
            Bulan
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: calMode === 'week' }"
            @click="calMode = 'week'"
          >
            Minggu
          </button>
        </div>

        <!-- Counter Badges & Drawer Trigger -->
        <div class="unscheduled-pill-wrap">
          <span class="scheduled-count-pill" :title="`${scheduledTasks.length} tugas berjadwal`">
            <span class="count-dot scheduled"></span>
            <span>{{ scheduledTasks.length }} Berjadwal</span>
          </span>
          <button
            type="button"
            class="unscheduled-toggle-btn"
            :class="{ active: showUnscheduledTray }"
            @click="showUnscheduledTray = !showUnscheduledTray"
            :title="showUnscheduledTray ? 'Tutup daftar tugas tanpa tenggat' : 'Buka daftar tugas tanpa tenggat'"
          >
            <span class="count-dot unscheduled"></span>
            <span>{{ unscheduledTasks.length }} Tanpa Tenggat</span>
            <svg
              class="chevron-icon"
              :class="{ open: showUnscheduledTray }"
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Calendar Area + Unscheduled Tray -->
    <div class="calendar-workspace">
      <!-- Calendar Viewport (Month or Week) -->
      <div class="calendar-viewport">
        <!-- Weekday Header Row (Sen - Min) -->
        <div class="weekdays-grid">
          <div
            v-for="(dayName, idx) in weekdayNames"
            :key="dayName"
            class="weekday-col-header"
            :class="{ weekend: idx >= 5 }"
          >
            <span>{{ dayName }}</span>
          </div>
        </div>

        <!-- Month Grid View (7 cols x 4-6 rows) -->
        <div v-if="calMode === 'month'" class="month-grid">
          <div
            v-for="cell in monthCells"
            :key="cell.dateStr"
            class="month-day-cell"
            :class="{
              'other-month': !cell.isCurrentMonth,
              'is-today': cell.isToday,
              'has-tasks': cell.tasks.length > 0,
              'drop-target': dragOverDate === cell.dateStr
            }"
            @dragover.prevent="onDragOverCell(cell.dateStr)"
            @dragleave="onDragLeaveCell(cell.dateStr)"
            @drop.prevent="onDropOnCell(cell.dateStr)"
          >
            <div class="cell-top">
              <span class="day-number" :class="{ 'today-badge': cell.isToday }">
                {{ cell.dayNum }}
              </span>
              <span v-if="cell.tasks.length > 0" class="cell-task-counter">
                {{ cell.tasks.length }}
              </span>
            </div>

            <!-- Task Chips List -->
            <div class="cell-task-list">
              <div
                v-for="task in cell.tasks.slice(0, 3)"
                :key="task.id"
                class="cal-task-chip"
                :class="{
                  'is-done': task.is_completed || task.status === 'DONE',
                  [`priority-${(task.priority || 'medium').toLowerCase()}`]: true
                }"
                draggable="true"
                @dragstart="onTaskDragStart($event, task)"
                @click.stop="taskStore.openDetailModal(task)"
                :title="`${task.title || task.task} (Klik untuk detail)`"
              >
                <!-- Space dot or icon -->
                <span
                  v-if="getTaskProject(task)"
                  class="chip-space-icon"
                  :style="{ color: getTaskProject(task)?.color }"
                  :title="getTaskProject(task)?.name"
                >
                  {{ getTaskProject(task)?.icon }}
                </span>
                <span v-else class="chip-priority-dot"></span>

                <span class="chip-title">
                  {{ task.title || task.task }}
                </span>
              </div>

              <!-- More Tasks Indicator -->
              <button
                v-if="cell.tasks.length > 3"
                type="button"
                class="more-tasks-btn"
                @click.stop="openDayTasks(cell)"
                :title="`Lihat ${cell.tasks.length} tugas`"
              >
                +{{ cell.tasks.length - 3 }} lagi
              </button>
            </div>
          </div>
        </div>

        <!-- Week Grid View (7 vertical expanded columns) -->
        <div v-else class="week-grid">
          <div
            v-for="day in weekDays"
            :key="day.dateStr"
            class="week-day-col"
            :class="{
              'is-today': day.isToday,
              'drop-target': dragOverDate === day.dateStr
            }"
            @dragover.prevent="onDragOverCell(day.dateStr)"
            @dragleave="onDragLeaveCell(day.dateStr)"
            @drop.prevent="onDropOnCell(day.dateStr)"
          >
            <div class="week-col-header">
              <span class="week-col-date" :class="{ 'today-badge': day.isToday }">
                {{ day.dayNum }}
              </span>
              <span class="week-col-info">
                {{ day.tasks.length }} tugas
              </span>
            </div>

            <!-- Task Cards Stack in Week Column -->
            <div class="week-tasks-stack">
              <div
                v-if="day.tasks.length === 0"
                class="week-empty-slot"
              >
                <span>Tarik tugas ke sini</span>
              </div>
              <div
                v-for="task in day.tasks"
                :key="task.id"
                class="week-task-card"
                :class="{ 'is-done': task.is_completed || task.status === 'DONE' }"
                draggable="true"
                @dragstart="onTaskDragStart($event, task)"
                @click.stop="taskStore.openDetailModal(task)"
              >
                <div class="week-card-top">
                  <span
                    v-if="getTaskProject(task)"
                    class="week-space-badge"
                    :style="{ color: getTaskProject(task)?.color, borderColor: `${getTaskProject(task)?.color}40`, background: `${getTaskProject(task)?.color}15` }"
                  >
                    {{ getTaskProject(task)?.icon }} {{ getTaskProject(task)?.name }}
                  </span>
                  <span class="week-priority-badge" :class="`p-${(task.priority || 'medium').toLowerCase()}`">
                    {{ task.priority || 'MEDIUM' }}
                  </span>
                </div>
                <h5 class="week-card-title">
                  {{ task.title || task.task }}
                </h5>
                <div class="week-card-footer">
                  <span v-if="task.estimated_hours" class="week-hours-pill">
                    {{ task.estimated_hours }}h
                  </span>
                  <span v-if="task.subtasks && task.subtasks.length > 0" class="week-subtask-pill">
                    {{ task.subtasks.filter(s => s.is_completed).length }}/{{ task.subtasks.length }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsible Unscheduled Backlog Tray (Tasks without due date) -->
      <Transition name="drawer">
        <aside v-if="showUnscheduledTray" class="unscheduled-tray">
          <div class="tray-header">
            <div class="tray-title-wrap">
              <span class="count-dot unscheduled"></span>
              <h4 class="tray-title">Tanpa Tenggat</h4>
              <span class="tray-badge">{{ unscheduledTasks.length }}</span>
            </div>
            <button
              type="button"
              class="tray-close-btn"
              @click="showUnscheduledTray = false"
              title="Tutup Panel"
            >
              &times;
            </button>
          </div>
          <p class="tray-caption">
            Tarik kartu ke tanggal kalender untuk menjadwalkan batas waktu.
          </p>

          <div class="tray-list">
            <div
              v-if="unscheduledTasks.length === 0"
              class="tray-empty"
            >
              Semua tugas telah memiliki batas waktu!
            </div>
            <div
              v-for="task in unscheduledTasks"
              :key="task.id"
              class="tray-task-card"
              draggable="true"
              @dragstart="onTaskDragStart($event, task)"
              @click.stop="taskStore.openDetailModal(task)"
              :title="`Tarik ke tanggal kalender untuk menetapkan tenggat`"
            >
              <div class="tray-card-header">
                <span
                  v-if="getTaskProject(task)"
                  class="tray-space-tag"
                  :style="{ color: getTaskProject(task)?.color }"
                >
                  {{ getTaskProject(task)?.icon }} {{ getTaskProject(task)?.name }}
                </span>
                <span class="tray-p-dot" :class="`p-${(task.priority || 'medium').toLowerCase()}`"></span>
              </div>
              <p class="tray-card-title">
                {{ task.title || task.task }}
              </p>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import type { Task, Project } from '~/types/task'

const props = defineProps<{
  tasks: Task[]
  pending?: boolean
}>()

const emit = defineEmits<{
  (e: 'update-due-date', payload: { task: Task; dueDate: string | null }): void
}>()

const taskStore = useTaskStore()

// State
const calMode = ref<'month' | 'week'>('month')
const showUnscheduledTray = ref<boolean>(false)
const currentDate = ref<Date>(new Date())
const dragOverDate = ref<string | null>(null)
let draggedTask = ref<Task | null>(null)

const weekdayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const monthNamesId = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// ─── Scheduled vs Unscheduled Tasks ──────────────────────────────────────────
const scheduledTasks = computed(() => {
  return props.tasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return !isNaN(d.getTime())
  })
})

const unscheduledTasks = computed(() => {
  return props.tasks.filter(t => {
    if (!t.due_date) return true
    const d = new Date(t.due_date)
    return isNaN(d.getTime())
  })
})

// Helper tanggal YYYY-MM-DD
const formatDateStr = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const todayStr = computed(() => formatDateStr(new Date()))

// Header Period Title
const periodTitle = computed(() => {
  const year = currentDate.value.getFullYear()
  const monthIdx = currentDate.value.getMonth()
  const monthName = monthNamesId[monthIdx] || ''

  if (calMode.value === 'month') {
    return `${monthName} ${year}`
  }

  // Week Mode title: range tanggal minggu aktif
  const curr = new Date(currentDate.value)
  const dayOfWeek = (curr.getDay() + 6) % 7 // 0: Sen, 6: Min
  const monday = new Date(curr)
  monday.setDate(curr.getDate() - dayOfWeek)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startStr = `${monday.getDate()} ${monthNamesId[monday.getMonth()]?.slice(0, 3)}`
  const endStr = `${sunday.getDate()} ${monthNamesId[sunday.getMonth()]?.slice(0, 3)} ${sunday.getFullYear()}`
  return `${startStr} – ${endStr}`
})

// ─── Month Grid Computation ──────────────────────────────────────────────────
interface MonthCell {
  dateStr: string
  dayNum: number
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
}

const monthCells = computed<MonthCell[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  // 0: Sen, 6: Min
  const startDay = (firstDayOfMonth.getDay() + 6) % 7

  const cells: MonthCell[] = []

  // Padding hari bulan lalu
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const prevDate = new Date(year, month - 1, d)
    const dateStr = formatDateStr(prevDate)
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr.value,
      tasks: getTasksForDate(dateStr)
    })
  }

  // Hari di bulan aktif
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dateStr = formatDateStr(date)
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr.value,
      tasks: getTasksForDate(dateStr)
    })
  }

  // Padding hari bulan depan (agar genap kelipatan 7 kolom)
  const totalCells = cells.length
  const remainder = totalCells % 7
  const nextPadding = remainder === 0 ? 0 : 7 - remainder
  for (let d = 1; d <= nextPadding; d++) {
    const nextDate = new Date(year, month + 1, d)
    const dateStr = formatDateStr(nextDate)
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr.value,
      tasks: getTasksForDate(dateStr)
    })
  }

  return cells
})

// ─── Week Grid Computation ───────────────────────────────────────────────────
interface WeekDay {
  dateStr: string
  dayNum: number
  isToday: boolean
  tasks: Task[]
}

const weekDays = computed<WeekDay[]>(() => {
  const curr = new Date(currentDate.value)
  const dayOfWeek = (curr.getDay() + 6) % 7 // 0: Sen, 6: Min
  const monday = new Date(curr)
  monday.setDate(curr.getDate() - dayOfWeek)

  const days: WeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = formatDateStr(d)
    days.push({
      dateStr,
      dayNum: d.getDate(),
      isToday: dateStr === todayStr.value,
      tasks: getTasksForDate(dateStr)
    })
  }
  return days
})

// Cari tugas pada tanggal tertentu
const getTasksForDate = (dateStr: string): Task[] => {
  return props.tasks.filter(t => {
    if (!t.due_date) return false
    return t.due_date.startsWith(dateStr)
  })
}

const getTaskProject = (task: Task): Project | null => {
  if (task.project) return task.project
  if (task.project_id) {
    return taskStore.projects.find(p => String(p.id) === String(task.project_id)) || null
  }
  return null
}

// ─── Navigation ──────────────────────────────────────────────────────────────
const navigate = (direction: number) => {
  const next = new Date(currentDate.value)
  if (calMode.value === 'month') {
    next.setMonth(next.getMonth() + direction)
  } else {
    next.setDate(next.getDate() + direction * 7)
  }
  currentDate.value = next
}

const jumpToToday = () => {
  currentDate.value = new Date()
}

// ─── Drag & Drop Reschedule ──────────────────────────────────────────────────
const onTaskDragStart = (e: DragEvent, task: Task) => {
  draggedTask.value = task
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(task.id))
  }
}

const onDragOverCell = (dateStr: string) => {
  dragOverDate.value = dateStr
}

const onDragLeaveCell = (dateStr: string) => {
  if (dragOverDate.value === dateStr) {
    dragOverDate.value = null
  }
}

const onDropOnCell = async (dateStr: string) => {
  dragOverDate.value = null
  if (!draggedTask.value) return

  const task = draggedTask.value
  draggedTask.value = null

  // Format ISO string UTC untuk tanggal tersebut
  const newIso = new Date(`${dateStr}T12:00:00.000Z`).toISOString()
  if (task.due_date && task.due_date.startsWith(dateStr)) return

  emit('update-due-date', { task, dueDate: newIso })
}

const openDayTasks = (cell: MonthCell) => {
  const first = cell.tasks[0]
  if (first) {
    taskStore.openDetailModal(first)
  }
}
</script>

<style scoped>
.calendar-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f1f5f9;
  min-height: 480px;
}

/* ─── Control Bar ─────────────────────────────────────────────────────────── */
.cal-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #0d1422;
  border-bottom: 1px solid #1f2a3f;
  flex-wrap: wrap;
  gap: 12px;
}

.nav-cluster {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cal-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #111726;
  border: 1px solid #1f2a3f;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.cal-nav-btn:hover {
  background: #172136;
  border-color: #3b82f6;
  color: #ffffff;
}

.cal-today-btn {
  padding: 4px 10px;
  height: 28px;
  border-radius: 6px;
  background: #111726;
  border: 1px solid #1f2a3f;
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.cal-today-btn:hover {
  background: #172136;
  border-color: #3b82f6;
  color: #ffffff;
}

.current-period-title {
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: -0.01em;
}

.cal-action-cluster {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Mode Switcher */
.cal-mode-switcher {
  display: flex;
  align-items: center;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.mode-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background 0.15s ease;
}

.mode-btn:hover:not(.active) {
  color: #f1f5f9;
}

.mode-btn.active {
  background: #1e293b;
  color: #ffffff;
  font-weight: 600;
}

/* Unscheduled Pill & Drawer Toggle */
.unscheduled-pill-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scheduled-count-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  font-size: 11.5px;
  color: #cbd5e1;
  font-weight: 500;
}

.count-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.count-dot.scheduled {
  background: #3b82f6;
}

.count-dot.unscheduled {
  background: #f59e0b;
}

.unscheduled-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  font-size: 11.5px;
  color: #cbd5e1;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.unscheduled-toggle-btn:hover {
  background: #172136;
  color: #f1f5f9;
}

.unscheduled-toggle-btn.active {
  background: #1a2336;
  border-color: #f59e0b;
  color: #f59e0b;
}

.chevron-icon {
  transition: transform 0.2s ease;
}

.chevron-icon.open {
  transform: rotate(180deg);
}

/* ─── Calendar Workspace ──────────────────────────────────────────────────── */
.calendar-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.calendar-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  background: #090d16;
}

/* ─── Weekdays Header Row ─────────────────────────────────────────────────── */
.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(110px, 1fr));
  background: #0d1422;
  border-bottom: 1px solid #1f2a3f;
}

.weekday-col-header {
  padding: 8px 10px;
  text-align: center;
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.weekday-col-header.weekend {
  color: #64748b;
}

/* ─── Month Grid ──────────────────────────────────────────────────────────── */
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(110px, 1fr));
  grid-auto-rows: minmax(105px, 1fr);
  flex: 1;
}

.month-day-cell {
  border-right: 1px solid #172136;
  border-bottom: 1px solid #172136;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #090d16;
  transition: background 0.15s ease, border-color 0.15s ease;
  position: relative;
}

.month-day-cell:nth-child(7n) {
  border-right: none;
}

.month-day-cell:hover {
  background: #0f172a;
}

.month-day-cell.other-month {
  background: #060910;
  opacity: 0.45;
}

.month-day-cell.is-today {
  background: #0e172a;
}

.month-day-cell.drop-target {
  background: #15223c;
  border: 1px dashed #3b82f6;
}

.cell-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.day-number {
  font-size: 11.5px;
  font-weight: 600;
  color: #cbd5e1;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.day-number.today-badge {
  background: #2563eb;
  color: #ffffff;
}

.cell-task-counter {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  background: #111726;
  padding: 1px 5px;
  border-radius: 9999px;
  border: 1px solid #1f2a3f;
}

.cell-task-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  overflow: hidden;
}

/* Task Chip */
.cal-task-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 6px;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 4px;
  font-size: 11.5px;
  color: #f1f5f9;
  cursor: grab;
  user-select: none;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.cal-task-chip:hover {
  background: #172136;
  border-color: #2d3b55;
  transform: translateY(-1px);
}

.cal-task-chip:active {
  cursor: grabbing;
}

.cal-task-chip.is-done {
  opacity: 0.55;
  text-decoration: line-through;
}

.chip-space-icon {
  font-size: 10.5px;
  line-height: 1;
  flex-shrink: 0;
}

.chip-priority-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}

.priority-low .chip-priority-dot { background: #94a3b8; }
.priority-medium .chip-priority-dot { background: #60a5fa; }
.priority-high .chip-priority-dot { background: #fbbf24; }
.priority-urgent .chip-priority-dot { background: #f87171; }

.chip-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.more-tasks-btn {
  background: transparent;
  border: none;
  font-size: 10.5px;
  color: #94a3b8;
  padding: 2px 4px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  transition: color 0.15s ease;
}

.more-tasks-btn:hover {
  color: #60a5fa;
}

/* ─── Week Grid View ──────────────────────────────────────────────────────── */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(130px, 1fr));
  flex: 1;
  background: #090d16;
}

.week-day-col {
  border-right: 1px solid #172136;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: background 0.15s ease;
}

.week-day-col:last-child {
  border-right: none;
}

.week-day-col.is-today {
  background: #0c1322;
}

.week-day-col.drop-target {
  background: #15223c;
  outline: 1px dashed #3b82f6;
}

.week-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid #172136;
}

.week-col-date {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.week-col-date.today-badge {
  background: #2563eb;
  color: #ffffff;
}

.week-col-info {
  font-size: 11px;
  color: #94a3b8;
}

.week-tasks-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.week-empty-slot {
  height: 60px;
  border: 1px dashed #1f2a3f;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 11.5px;
}

.week-task-card {
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: grab;
  user-select: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.week-task-card:hover {
  border-color: #2d3b55;
  transform: translateY(-1px);
}

.week-task-card:active {
  cursor: grabbing;
}

.week-task-card.is-done {
  opacity: 0.55;
}

.week-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.week-space-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90px;
}

.week-priority-badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.02em;
}

.week-priority-badge.p-low { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
.week-priority-badge.p-medium { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.week-priority-badge.p-high { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.week-priority-badge.p-urgent { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.week-card-title {
  font-size: 12.5px;
  font-weight: 500;
  color: #f1f5f9;
  margin: 0;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.week-card-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: #94a3b8;
}

.week-hours-pill,
.week-subtask-pill {
  background: #090d16;
  border: 1px solid #1f2a3f;
  padding: 1px 5px;
  border-radius: 4px;
}

/* ─── Unscheduled Tray ────────────────────────────────────────────────────── */
.unscheduled-tray {
  width: 260px;
  background: #0b101c;
  border-left: 1px solid #1f2a3f;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.tray-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #1f2a3f;
  background: #0d1422;
}

.tray-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tray-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.tray-badge {
  font-size: 10.5px;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  padding: 1px 6px;
  border-radius: 9999px;
}

.tray-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
}

.tray-close-btn:hover {
  color: #f1f5f9;
}

.tray-caption {
  font-size: 11px;
  color: #94a3b8;
  padding: 8px 14px 4px 14px;
  margin: 0;
  line-height: 1.35;
}

.tray-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  overflow-y: auto;
  flex: 1;
}

.tray-empty {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  padding: 24px 8px;
}

.tray-task-card {
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: grab;
  user-select: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.tray-task-card:hover {
  border-color: #2d3b55;
  transform: translateY(-1px);
}

.tray-task-card:active {
  cursor: grabbing;
}

.tray-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tray-space-tag {
  font-size: 10.5px;
  font-weight: 550;
}

.tray-p-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.tray-p-dot.p-low { background: #94a3b8; }
.tray-p-dot.p-medium { background: #60a5fa; }
.tray-p-dot.p-high { background: #fbbf24; }
.tray-p-dot.p-urgent { background: #f87171; }

.tray-card-title {
  font-size: 12px;
  color: #e2e8f0;
  margin: 0;
  line-height: 1.35;
}

/* ─── Transitions ─────────────────────────────────────────────────────────── */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ─── Responsive Media Queries ────────────────────────────────────────────── */
@media (max-width: 900px) {
  .cal-control-bar {
    padding: 10px 14px;
    gap: 10px;
  }
  .weekdays-grid {
    grid-template-columns: repeat(7, minmax(80px, 1fr));
  }
  .month-grid {
    grid-template-columns: repeat(7, minmax(80px, 1fr));
    grid-auto-rows: minmax(95px, 1fr);
  }
  .week-grid {
    grid-template-columns: repeat(7, minmax(120px, 1fr));
  }
}

@media (max-width: 640px) {
  .cal-control-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 12px;
  }

  .nav-cluster {
    justify-content: space-between;
    width: 100%;
  }

  .current-period-title {
    font-size: 13.5px;
  }

  .cal-action-cluster {
    justify-content: space-between;
    width: 100%;
  }

  .weekdays-grid {
    grid-template-columns: repeat(7, minmax(44px, 1fr));
  }

  .weekday-col-header {
    padding: 6px 2px;
    font-size: 10.5px;
  }

  .month-grid {
    grid-template-columns: repeat(7, minmax(44px, 1fr));
    grid-auto-rows: minmax(78px, 1fr);
  }

  .month-day-cell {
    padding: 4px 3px;
    gap: 2px;
  }

  .day-number {
    width: 18px;
    height: 18px;
    font-size: 10px;
  }

  .cell-task-counter {
    display: none;
  }

  .cal-task-chip {
    padding: 2px 4px;
    font-size: 10px;
    gap: 3px;
  }

  .chip-title {
    font-size: 10px;
  }

  .week-grid {
    grid-template-columns: repeat(7, minmax(110px, 1fr));
  }

  .unscheduled-tray {
    position: absolute;
    inset: 0;
    width: 100%;
    z-index: 30;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.6);
  }
}
</style>
