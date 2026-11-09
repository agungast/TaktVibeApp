<template>
  <Teleport to="body">
    <Transition name="cmd-palette">
      <div v-if="open" class="cmd-backdrop" @click.self="close">
        <div class="cmd-modal" role="dialog" aria-modal="true">
          <div class="cmd-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input ref="inputRef" v-model="query" class="cmd-input" placeholder="Cari tugas, ruang kerja, aksi..." @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="runActive" @keydown.esc.prevent="close" />
            <span class="cmd-hint">Esc</span>
          </div>
          <div class="cmd-list">
            <div v-if="results.length === 0" class="cmd-empty">Tidak ada hasil</div>
            <button v-for="(r, i) in results" :key="r.key" type="button" class="cmd-item" :class="{ active: i === activeIndex }" @mouseenter="activeIndex = i" @click="run(r)">
              <span class="cmd-item-icon">{{ r.icon }}</span>
              <div class="cmd-item-text">
                <div class="cmd-item-title">{{ r.title }}</div>
                <div v-if="r.subtitle" class="cmd-item-subtitle">{{ r.subtitle }}</div>
              </div>
              <span v-if="r.shortcut" class="cmd-item-shortcut">{{ r.shortcut }}</span>
            </button>
          </div>
          <div class="cmd-footer">Ctrl+K / ⌘+K • c Buat tugas • / Cari • Esc Tutup</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import { useTheme } from '~/composables/useTheme'

const taskStore = useTaskStore()
const router = useRouter()
const route = useRoute()
const { toggleTheme, isDark } = useTheme()

const open = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)

type Item = { key: string, icon: string, title: string, subtitle?: string, shortcut?: string, action: () => void }

const results = computed<Item[]>(() => {
  const q = query.value.trim().toLowerCase()
  const items: Item[] = []

  items.push({ key: 'new-task', icon: '➕', title: 'Buat Tugas Baru', shortcut: 'c', action: () => { taskStore.showTemplateModal ? taskStore.openTemplateModal() : null; close(); router.push('/dashboard') } })
  items.push({ key: 'quick-add', icon: '⚡', title: 'Quick Add (Template)', action: () => { taskStore.openTemplateModal(); close() } })
  items.push({ key: 'toggle-theme', icon: isDark.value ? '🌞' : '🌙', title: isDark.value ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap', action: () => { toggleTheme(); close() } })
  items.push({ key: 'view-table', icon: '📋', title: 'Tampilan Tabel', action: () => { taskStore.setViewMode('table'); close(); router.push('/dashboard') } })
  items.push({ key: 'view-kanban', icon: '🗂️', title: 'Tampilan Kanban', action: () => { taskStore.setViewMode('kanban'); close(); router.push('/dashboard') } })
  items.push({ key: 'view-calendar', icon: '📅', title: 'Tampilan Kalender', action: () => { taskStore.setViewMode('calendar'); close(); router.push('/dashboard') } })
  items.push({ key: 'all-spaces', icon: '🌐', title: 'Semua Ruang Kerja', action: () => { taskStore.setActiveProject(null); close(); router.push('/dashboard') } })

  for (const p of taskStore.projects || []) {
    items.push({ key: `proj-${p.id}`, icon: p.icon, title: p.name, subtitle: 'Ruang Kerja', action: () => { taskStore.setActiveProject(p.id); close(); router.push('/dashboard') } })
  }

  for (const t of taskStore.tasks || []) {
    items.push({ key: `task-${t.id}`, icon: '📝', title: t.title, subtitle: t.status, action: async () => { await taskStore.openDetailModal(t); close() } })
  }

  if (!q) return items.slice(0, 12)
  return items.filter(i => (i.title + ' ' + (i.subtitle || '')).toLowerCase().includes(q)).slice(0, 12)
})

watch(results, () => { activeIndex.value = 0 })

function openPalette() { open.value = true; query.value = ''; nextTick(() => inputRef.value?.focus()) }
function close() { open.value = false }
function move(d: number) { activeIndex.value = (activeIndex.value + d + results.value.length) % results.value.length }
function runActive() { const r = results.value[activeIndex.value]; if (r) run(r) }
function run(r: Item) { r.action() }

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey && route.path === '/dashboard') {
      // allow create shortcut only outside input
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openPalette()
    return
  }
  if (!open.value && e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    e.preventDefault()
    router.push('/dashboard')
    return
  }
  if (!open.value && e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    e.preventDefault()
    openPalette()
    return
  }
  if (e.key === 'Escape' && open.value) {
    e.preventDefault()
    close()
  }
}

onMounted(() => { window.addEventListener('keydown', onKey) })
onUnmounted(() => { window.removeEventListener('keydown', onKey) })

defineExpose({ openPalette, close })
</script>

<style scoped>
.cmd-backdrop { position: fixed; inset: 0; background: var(--modal-backdrop-bg); display: flex; align-items: flex-start; justify-content: center; z-index: 99999; padding-top: 12vh; font-family: 'Outfit', sans-serif; }
.cmd-modal { width: 100%; max-width: 560px; background: var(--modal-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-elevated); }
.cmd-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); }
.cmd-input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-family: inherit; font-size: 14px; outline: none; }
.cmd-hint { font-size: 11px; padding: 2px 6px; border: 1px solid var(--border-color); border-radius: 6px; }
.cmd-list { max-height: 320px; overflow-y: auto; padding: 6px; }
.cmd-empty { padding: 12px; color: var(--text-secondary); font-size: 13px; text-align: center; }
.cmd-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; border: none; background: transparent; color: var(--text-soft); text-align: left; cursor: pointer; font-family: inherit; }
.cmd-item:hover { background: var(--bg-hover); }
.cmd-item.active { background: var(--bg-active); color: var(--text-primary); }
.cmd-item-icon { font-size: 14px; }
.cmd-item-text { flex: 1; min-width: 0; }
.cmd-item-title { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cmd-item-subtitle { font-size: 11px; color: var(--text-secondary); }
.cmd-item-shortcut { font-size: 11px; color: var(--text-secondary); padding: 1px 6px; border: 1px solid var(--border-color); border-radius: 6px; }
.cmd-footer { padding: 6px 12px; border-top: 1px solid var(--border-color); font-size: 11px; color: var(--text-secondary); text-align: center; }
.cmd-palette-enter-active, .cmd-palette-leave-active { transition: opacity 0.15s ease; }
.cmd-palette-enter-active .cmd-modal, .cmd-palette-leave-active .cmd-modal { transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), opacity 0.15s ease; }
.cmd-palette-enter-from, .cmd-palette-leave-to { opacity: 0; }
.cmd-palette-enter-from .cmd-modal, .cmd-palette-leave-to .cmd-modal { opacity: 0; transform: scale(0.98) translateY(-4px); }
</style>
