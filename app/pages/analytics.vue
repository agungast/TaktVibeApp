<template>
  <main class="page-content">
    <header class="page-header">
      <div class="page-heading">
        <h1 class="page-title">Analitik & Briefing</h1>
        <p class="page-summary">Produktivitas mingguan/harian dan ekspor data</p>
      </div>
      <div class="page-actions">
        <button type="button" class="ghost-btn" @click="exportCsv">Ekspor CSV</button>
        <button type="button" class="ghost-btn" @click="exportMd">Ekspor Markdown</button>
        <button type="button" class="primary-btn" @click="generateBriefing">Buat Briefing AI</button>
      </div>
    </header>

    <div class="grid">
      <section class="card">
        <div class="card-header"><h2 class="card-title">Metrik</h2></div>
        <div class="card-body metrics">
          <div class="metric"><div class="metric-label">Total</div><div class="metric-value">{{ total }}</div></div>
          <div class="metric"><div class="metric-label">Selesai</div><div class="metric-value">{{ done }}</div></div>
          <div class="metric"><div class="metric-label">Aktif</div><div class="metric-value">{{ active }}</div></div>
          <div class="metric"><div class="metric-label">Terlambat</div><div class="metric-value">{{ overdue }}</div></div>
          <div class="metric"><div class="metric-label">Estimasi Jam</div><div class="metric-value">{{ estHours }}h</div></div>
          <div class="metric"><div class="metric-label">Aktual Jam</div><div class="metric-value">{{ actHours }}h</div></div>
        </div>
      </section>

      <section class="card">
        <div class="card-header"><h2 class="card-title">Distribusi Prioritas</h2></div>
        <div class="card-body list">
          <div v-for="p in priorities" :key="p.label" class="row"><span>{{ p.label }}</span><span class="count">{{ p.count }}</span></div>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-header"><h2 class="card-title">AI Briefing {{ period === 'weekly' ? 'Mingguan' : 'Harian' }}</h2>
        <div class="seg">
          <button type="button" :class="{active: period==='weekly'}" @click="period='weekly'">Mingguan</button>
          <button type="button" :class="{active: period==='daily'}" @click="period='daily'">Harian</button>
        </div>
      </div>
      <div class="card-body">
        <pre class="md">{{ briefing.summary_markdown || 'Belum ada briefing. Klik "Buat Briefing AI".' }}</pre>
        <div v-if="briefing.highlights?.length" class="highlights">
          <span v-for="h in briefing.highlights" :key="h" class="hl">{{ h }}</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/stores/taskStore'
const taskStore = useTaskStore()
await taskStore.fetchTasks()

const period = ref<'daily'|'weekly'>('weekly')
const briefing = ref<any>({ summary_markdown: '', highlights: [] })

const total = computed(() => taskStore.tasks.length)
const done = computed(() => taskStore.tasks.filter(t => t.status === 'DONE').length)
const active = computed(() => taskStore.tasks.filter(t => t.status !== 'DONE' && t.status !== 'ARCHIVED').length)
const overdue = computed(() => taskStore.tasks.filter(t => t.status !== 'DONE' && t.status !== 'ARCHIVED' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString())).length)
const estHours = computed(() => taskStore.tasks.reduce((s,t)=>s+Number(t.estimated_hours||0),0))
const actHours = computed(() => taskStore.tasks.reduce((s,t)=>s+Number(t.actual_hours||0),0))

const priorities = computed(() => {
  const map: any = { URGENT:0, HIGH:0, MEDIUM:0, LOW:0 }
  for (const t of taskStore.tasks) map[t.priority] = (map[t.priority]||0)+1
  return [{label:'Urgent',count:map.URGENT},{label:'Tinggi',count:map.HIGH},{label:'Sedang',count:map.MEDIUM},{label:'Rendah',count:map.LOW}]
})

async function generateBriefing() {
  try {
    const res: any = await $fetch('/api/ai/briefing', { method: 'POST', body: { period: period.value, completed_tasks: taskStore.tasks.filter(t=>t.status==='DONE'), pending_tasks: taskStore.tasks.filter(t=>t.status!=='DONE' && t.status!=='ARCHIVED') } })
    briefing.value = res
  } catch { briefing.value = { summary_markdown: 'Gagal membuat briefing.', highlights: [] } }
}

function escapeCsv(val: any): string {
  const s = String(val ?? '')
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function exportCsv() {
  const tasks = taskStore.tasks || []
  if (tasks.length > 1000) {
    alert('Terlalu banyak tugas untuk diekspor CSV (maks 1000). Filter atau ekspor sebagian.')
    return
  }
  const rows = ['id,title,status,priority,due_date,estimated_hours,actual_hours']
  for (const t of tasks) {
    rows.push([
      escapeCsv(t.id),
      escapeCsv(t.title),
      escapeCsv(t.status),
      escapeCsv(t.priority),
      escapeCsv(t.due_date || ''),
      escapeCsv(t.estimated_hours || 0),
      escapeCsv(t.actual_hours || 0)
    ].join(','))
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `taktvibe-tasks-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

function escapeMd(val: any): string {
  return String(val ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function exportMd() {
  const tasks = taskStore.tasks || []
  if (tasks.length > 1000) {
    alert('Terlalu banyak tugas untuk diekspor Markdown (maks 1000).')
    return
  }
  const lines = ['# Export Tugas TaktVibe', '', '| Judul | Status | Prioritas | Tenggat | Est | Aktual |', '|---|---|---|---|---|---|']
  for (const t of tasks) {
    const due = t.due_date ? new Date(t.due_date).toLocaleDateString('id-ID') : '-'
    lines.push(`| ${escapeMd(t.title)} | ${escapeMd(t.status)} | ${escapeMd(t.priority)} | ${due} | ${Number(t.estimated_hours||0)}h | ${Number(t.actual_hours||0)}h |`)
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `taktvibe-tasks-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<style scoped>
.page-content { flex:1; padding:24px; display:flex; flex-direction:column; gap:16px; background:var(--bg-base,#090d16); font-family:'Outfit',sans-serif; }
.page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.page-title { margin:0; font-size:30px; font-weight:650; color:var(--text-heading); }
.page-summary { margin:6px 0 0; font-size:13px; color:var(--text-secondary); }
.page-actions { display:flex; gap:8px; flex-wrap:wrap; }
.primary-btn,.ghost-btn { min-height:38px; padding:8px 14px; border-radius:8px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; }
.primary-btn { background:var(--accent-primary); border:1px solid rgba(255,255,255,.12); color:#fff; }
.ghost-btn { background:transparent; border:1px solid var(--border-color); color:var(--text-soft); }
.grid { display:grid; grid-template-columns:2fr 1fr; gap:16px; }
.card { background:var(--bg-surface); border:1px solid var(--border-color); border-radius:12px; overflow:hidden; }
.card-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border-color); }
.card-title { margin:0; font-size:14px; font-weight:600; color:var(--text-primary); }
.card-body { padding:16px; }
.metrics { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
.metric { background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center; }
.metric-label { font-size:11px; color:var(--text-secondary); }
.metric-value { font-size:18px; font-weight:700; color:var(--text-primary); }
.list { display:flex; flex-direction:column; gap:6px; }
.row { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:8px; color:var(--text-soft); font-size:13px; }
.count { color:var(--text-primary); font-weight:600; }
.seg { display:flex; gap:2px; background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:8px; padding:2px; }
.seg button { padding:4px 10px; border:none; background:transparent; color:var(--text-secondary); border-radius:6px; font-family:inherit; cursor:pointer; }
.seg button.active { background:var(--bg-hover); color:var(--text-primary); }
.md { background:var(--bg-subtle); border:1px solid var(--border-color); border-radius:10px; padding:12px; color:var(--text-primary); font-family:ui-monospace,monospace; font-size:12.5px; line-height:1.6; white-space:pre-wrap; overflow:auto; max-height:420px; }
.highlights { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.hl { padding:4px 8px; border-radius:999px; background:var(--bg-elevated); border:1px solid var(--border-subtle); color:var(--text-soft); font-size:11px; }
@media (max-width:900px){ .grid { grid-template-columns:1fr; } .metrics { grid-template-columns:repeat(3,1fr); } }
</style>
