<template>
  <Teleport to="body">
    <Transition name="copilot-drawer">
      <div v-if="open" class="copilot-backdrop" @click.self="close"></div>
    </Transition>
    <Transition name="copilot-slide">
      <aside v-if="open" class="copilot-drawer" role="dialog" aria-modal="true">
        <div class="copilot-header">
          <div class="copilot-title-wrap">
            <span class="copilot-dot"></span>
            <h3 class="copilot-title">TaktVibe Copilot</h3>
          </div>
          <button type="button" class="copilot-close" @click="close">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="copilot-messages" ref="msgRef">
          <div v-for="(m, i) in messages" :key="i" class="copilot-msg" :class="m.role">
            <div class="copilot-bubble">{{ m.content }}</div>
            <button v-if="m.suggestedAction && m.suggestedAction.type === 'update_status'" type="button" class="copilot-action" @click="applyAction(m.suggestedAction)">Terapkan: Pindah status</button>
          </div>
          <div v-if="loading" class="copilot-msg assistant"><div class="copilot-bubble">Berpikir...</div></div>
        </div>
        <form class="copilot-input-wrap" @submit.prevent="send">
          <input v-model="input" class="copilot-input" placeholder="Tanya tentang prioritas, minta rekomendasi..." :disabled="loading" />
          <button type="submit" class="copilot-send" :disabled="loading || !input.trim()">Kirim</button>
        </form>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
import { useAuthStore } from '~/stores/authStore'

const taskStore = useTaskStore()
const authStore = useAuthStore()
const open = ref(false)
const input = ref('')
const loading = ref(false)
const msgRef = ref<HTMLElement | null>(null)
const messages = ref<Array<{ role: 'user' | 'assistant', content: string, suggestedAction?: any }>>([
  { role: 'assistant', content: 'Halo! Saya TaktVibe Copilot. Tanyakan "Tugas prioritas mana yang paling mendesak minggu ini?" atau minta rekomendasi fokus.' }
])

function toggle() { open.value = !open.value }
function close() { open.value = false }
defineExpose({ toggle, open: () => { open.value = true } })

const tasksSummary = computed(() => (taskStore.tasks || []).slice(0, 15).map(t => ({ title: t.title, status: t.status, priority: t.priority, due_date: t.due_date, estimated_hours: t.estimated_hours })))

async function send() {
  if (!input.value.trim() || loading.value) return
  const text = input.value.trim()
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  await nextTick()
  scroll()
  try {
    const res: any = await $fetch('/api/ai/chat', { method: 'POST', body: { message: text, history: messages.value.slice(-6), tasks_summary: tasksSummary.value } })
    messages.value.push({ role: 'assistant', content: res.reply || '...', suggestedAction: res.suggested_action })
  } catch {
    messages.value.push({ role: 'assistant', content: 'Gagal menghubungi Copilot. Coba lagi.' })
  } finally {
    loading.value = false
    await nextTick()
    scroll()
  }
}

function scroll() {
  const el = msgRef.value
  if (el) el.scrollTop = el.scrollHeight
}

function applyAction(a: any) {
  if (a.type === 'update_status' && a.taskId) {
    const t = (taskStore.tasks || []).find(x => x.id === a.taskId)
    if (t) taskStore.updateTaskStatus(t, a.status || 'IN_PROGRESS')
  }
}
</script>

<style scoped>
.copilot-backdrop { position: fixed; inset: 0; background: var(--modal-backdrop-bg); z-index: 99998; }
.copilot-drawer { position: fixed; top: 0; right: 0; height: 100vh; width: 100%; max-width: 380px; background: var(--modal-bg); border-left: 1px solid var(--border-color); z-index: 99999; display: flex; flex-direction: column; font-family: 'Outfit', sans-serif; }
.copilot-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--border-color); background: var(--bg-subtle); }
.copilot-title-wrap { display: flex; align-items: center; gap: 8px; }
.copilot-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); }
.copilot-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-heading); }
.copilot-close { width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.copilot-close:hover { background: var(--bg-hover); color: var(--text-primary); }
.copilot-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.copilot-msg { display: flex; flex-direction: column; gap: 6px; max-width: 90%; }
.copilot-msg.user { align-self: flex-end; }
.copilot-msg.assistant { align-self: flex-start; }
.copilot-bubble { padding: 8px 12px; border-radius: 10px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
.copilot-msg.assistant .copilot-bubble { background: var(--bg-elevated); color: var(--text-soft); border: 1px solid var(--border-color); }
.copilot-msg.user .copilot-bubble { background: var(--accent-primary); color: #ffffff; }
.copilot-action { align-self: flex-start; padding: 5px 10px; border-radius: 7px; border: 1px solid var(--border-color); background: transparent; color: var(--text-soft); font-size: 12px; cursor: pointer; font-family: inherit; }
.copilot-action:hover { background: var(--bg-hover); color: var(--text-primary); }
.copilot-input-wrap { display: flex; gap: 8px; padding: 10px; border-top: 1px solid var(--border-color); background: var(--bg-subtle); }
.copilot-input { flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--input-color); font-family: inherit; font-size: 13px; }
.copilot-input:focus { outline: none; border-color: var(--accent-primary); }
.copilot-send { padding: 8px 12px; border-radius: 8px; border: none; background: var(--accent-primary); color: #ffffff; font-weight: 600; cursor: pointer; font-family: inherit; transition: background-color 0.15s ease; }
.copilot-send:hover:not(:disabled) { background: var(--accent-primary-hover); }
.copilot-slide-enter-active, .copilot-slide-leave-active { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
.copilot-slide-enter-from, .copilot-slide-leave-to { transform: translateX(100%); }
.copilot-drawer-enter-active, .copilot-drawer-leave-active { transition: opacity 0.2s ease; }
.copilot-drawer-enter-from, .copilot-drawer-leave-to { opacity: 0; }
</style>
