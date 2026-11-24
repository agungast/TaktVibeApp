<template>
  <div ref="rootRef" class="dp" :class="{ 'dp-disabled': disabled }">
    <button
      type="button"
      class="dp-trigger"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <span :class="modelValue ? 'dp-value' : 'dp-placeholder'">
        {{ displayText }}
      </span>
      <span class="dp-trigger-actions">
        <span
          v-if="modelValue && !disabled"
          class="dp-clear"
          role="button"
          tabindex="0"
          aria-label="Hapus tanggal"
          @click.stop="clear"
          @keydown.enter.prevent.stop="clear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </span>
        <svg class="dp-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      </span>
    </button>

    <Transition name="dp-pop">
      <div v-if="open" class="dp-popup" role="dialog" aria-label="Pilih tanggal">
        <div class="dp-nav">
          <button type="button" class="dp-nav-btn" aria-label="Bulan sebelumnya" @click="shiftMonth(-1)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button type="button" class="dp-nav-label" @click="toggleYearPicker">
            {{ monthLabel }}
          </button>
          <button type="button" class="dp-nav-btn" aria-label="Bulan berikutnya" @click="shiftMonth(1)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <template v-if="!yearMode">
          <div class="dp-weekdays">
            <span v-for="d in weekdays" :key="d" class="dp-weekday">{{ d }}</span>
          </div>
          <div class="dp-grid">
            <button
              v-for="cell in cells"
              :key="cell.key"
              type="button"
              class="dp-day"
              :class="{
                'is-other': !cell.current,
                'is-today': cell.isToday,
                'is-selected': cell.value === modelValue
              }"
              @click="select(cell.value)"
            >
              {{ cell.day }}
            </button>
          </div>
        </template>

        <div v-else class="dp-year-grid">
          <button
            v-for="y in years"
            :key="y"
            type="button"
            class="dp-year"
            :class="{ 'is-selected': y === viewYear }"
            @click="pickYear(y)"
          >
            {{ y }}
          </button>
        </div>

        <div class="dp-footer">
          <button type="button" class="dp-foot-btn" @click="goToday">Hari ini</button>
          <button v-if="modelValue" type="button" class="dp-foot-btn" @click="clear">Hapus</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string | null
  disabled?: boolean
  placeholder?: string
}>(), {
  disabled: false,
  placeholder: 'Pilih tanggal'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const yearMode = ref(false)
const weekdays = ['S', 'S', 'R', 'K', 'J', 'S', 'M']
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const toDate = (s: string | null): Date | null => {
  if (!s) return null
  const parts = s.split('T')[0]!.split('-').map(Number)
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!)
}

const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const selectedDate = computed(() => toDate(props.modelValue))
const viewDate = ref<Date>(selectedDate.value ?? new Date())
const viewYear = computed(() => viewDate.value.getFullYear())
const monthLabel = computed(() => `${monthNames[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`)
const displayText = computed(() => {
  const d = selectedDate.value
  if (!d) return props.placeholder
  return `${pad(d.getDate())} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
})

const today = new Date()
const todayISO = toISO(today)

watch(selectedDate, (d) => {
  if (d && open.value) viewDate.value = d
})

interface Cell { key: string; day: number; value: string; current: boolean; isToday: boolean }

const cells = computed<Cell[]>(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = first.getDay()
  const start = new Date(year, month, 1 - startOffset)
  const out: Cell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const value = toISO(d)
    out.push({
      key: value,
      day: d.getDate(),
      value,
      current: d.getMonth() === month,
      isToday: value === todayISO
    })
  }
  return out
})

const years = computed(() => {
  const base = viewYear.value - 6
  return Array.from({ length: 13 }, (_, i) => base + i)
})

const shiftMonth = (delta: number) => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + delta, 1)
}

const pickYear = (y: number) => {
  viewDate.value = new Date(y, viewDate.value.getMonth(), 1)
  yearMode.value = false
}

const toggleYearPicker = () => { yearMode.value = !yearMode.value }

const select = (value: string) => {
  emit('update:modelValue', value)
  emit('change', value)
  open.value = false
}

const clear = () => {
  emit('update:modelValue', '')
  emit('change', '')
  open.value = false
}

const goToday = () => select(todayISO)

const toggle = () => {
  if (props.disabled) return
  const willOpen = !open.value
  yearMode.value = false
  if (willOpen) viewDate.value = selectedDate.value ?? new Date()
  open.value = willOpen
}

const onDocClick = (e: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false
}
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.dp {
  position: relative;
  width: 100%;
}

.dp-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  background: var(--input-bg, var(--bg-base));
  border: 1px solid var(--input-border, var(--border-color));
  border-radius: var(--radius-control);
  color: var(--input-color, var(--text-primary));
  font-family: inherit;
  font-size: 12px;
  height: 32px;
  padding: 0 10px;
  cursor: pointer;
  transition: border-color 0.15s ease;
  text-align: left;
}

.dp-trigger:hover:not(:disabled),
.dp-trigger:focus-visible {
  border-color: var(--border-subtle, var(--border-subtle));
  outline: none;
}

.dp-trigger:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.15);
}

.dp-disabled .dp-trigger {
  opacity: 0.5;
  cursor: not-allowed;
}

.dp-value {
  color: var(--input-color, var(--text-primary));
}

.dp-placeholder {
  color: var(--input-placeholder, var(--text-secondary));
}

.dp-trigger-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dp-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  color: var(--text-secondary, var(--text-secondary));
  cursor: pointer;
}

.dp-clear:hover {
  color: var(--text-primary, var(--text-primary));
  background: var(--bg-hover, var(--bg-hover));
}

.dp-icon {
  color: var(--text-secondary, var(--text-secondary));
}

.dp-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 80;
  width: 260px;
  background: var(--dropdown-bg, var(--bg-elevated));
  border: 1px solid var(--border-color, var(--border-color));
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elevated, 0 16px 36px rgba(0, 0, 0, 0.6));
  padding: 10px;
}

.dp-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dp-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-control);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary, var(--text-secondary));
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.dp-nav-btn:hover {
  background: var(--bg-hover, var(--bg-hover));
  color: var(--text-primary, var(--text-primary));
}

.dp-nav-label {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary, var(--text-primary));
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-control);
}

.dp-nav-label:hover {
  background: var(--bg-hover, var(--bg-hover));
}

.dp-weekdays,
.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dp-weekday {
  text-align: center;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted, var(--text-muted));
  padding: 4px 0;
}

.dp-day {
  aspect-ratio: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-control);
  color: var(--text-soft, var(--text-soft));
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.dp-day:hover {
  background: var(--bg-hover, var(--bg-hover));
  color: var(--text-primary, var(--text-primary));
}

.dp-day.is-other {
  color: var(--text-muted, var(--text-muted));
}

.dp-day.is-today {
  color: var(--accent-primary, var(--accent-primary));
  font-weight: 700;
}

.dp-day.is-selected {
  background: var(--accent-primary, var(--accent-primary));
  color: #ffffff;
  font-weight: 600;
}

.dp-day.is-selected:hover {
  background: var(--accent-primary-hover, var(--accent-primary-hover));
}

.dp-year-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.dp-year {
  padding: 7px 0;
  border-radius: var(--radius-control);
  border: none;
  background: transparent;
  color: var(--text-soft, var(--text-soft));
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.dp-year:hover {
  background: var(--bg-hover, var(--bg-hover));
  color: var(--text-primary, var(--text-primary));
}

.dp-year.is-selected {
  background: var(--accent-primary, var(--accent-primary));
  color: #ffffff;
  font-weight: 600;
}

.dp-footer {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color, var(--border-color));
}

.dp-foot-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-color, var(--border-color));
  background: transparent;
  color: var(--text-soft, var(--text-soft));
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.dp-foot-btn:hover {
  background: var(--bg-hover, var(--bg-hover));
  color: var(--text-primary, var(--text-primary));
  border-color: var(--border-subtle, var(--border-subtle));
}

.dp-pop-enter-active,
.dp-pop-leave-active {
  transition: opacity 0.16s cubic-bezier(0.16, 1, 0.3, 1), transform 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}

.dp-pop-enter-from,
.dp-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .dp-pop-enter-active,
  .dp-pop-leave-active {
    transition: none;
  }
}
</style>
