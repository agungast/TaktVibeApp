<template>
  <div
    class="tour"
    :class="{ 'is-paused': paused }"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <!-- Tab Bab + Progress -->
    <div class="tour-head">
      <div class="tour-tabs" role="tablist" aria-label="Tur fitur otomatis">
        <button
          v-for="(s, i) in scenes"
          :key="s.num"
          type="button"
          role="tab"
          class="tour-tab"
          :class="{ active: active === i }"
          :aria-selected="active === i"
          :tabindex="active === i ? 0 : -1"
          @click="go(i)"
        >
          <span class="tour-tab-num">{{ s.num }}</span>
          <span class="tour-tab-label">{{ s.label }}</span>
        </button>
      </div>
    </div>

    <div class="tour-progress" aria-hidden="true">
      <span
        v-for="(s, i) in scenes"
        :key="`p-${s.num}-${runId}`"
        class="tour-seg"
        :class="{ active: active === i }"
      >
        <span
          v-if="active === i && autoplay"
          class="tour-seg-fill"
          :style="{ animationDuration: `${duration}ms` }"
          @animationend="next"
        ></span>
      </span>
    </div>

    <!-- Panggung -->
    <div class="tour-stage">
      <Transition name="tour-fade" mode="out-in">
        <div :key="active" class="tour-scene" role="tabpanel" :aria-label="scenes[active]?.label">
          <!-- ─── BAB 01: TIGA SUDUT PANDANG ─────────────────────────────── -->
          <div v-if="active === 0" class="scene-multi">
            <div class="mv-toolbar">
              <span class="mv-seg is-on">Papan Kanban</span>
              <span class="mv-seg">Kalender</span>
              <span class="mv-seg">Tabel</span>
            </div>
            <div class="mv-panes">
              <div class="mv-pane mv-kanban">
                <span class="mv-pane-label">Papan Kanban</span>
                <div class="mv-col">
                  <span class="mv-col-name">Proses Pengerjaan</span>
                  <div class="mv-card">
                    <span class="mv-card-title">Rilis modul pembayaran</span>
                    <span class="mv-card-tag">Tinggi</span>
                  </div>
                </div>
              </div>

              <div class="mv-pane mv-calendar">
                <span class="mv-pane-label">Kalender</span>
                <div class="mv-month">Oktober 2026</div>
                <div class="mv-week">
                  <div class="mv-day"><span class="mv-day-num">22</span></div>
                  <div class="mv-day is-on">
                    <span class="mv-day-num">24</span>
                    <span class="mv-card-title">Rilis modul pembayaran</span>
                  </div>
                  <div class="mv-day"><span class="mv-day-num">26</span></div>
                </div>
              </div>

              <div class="mv-pane mv-table">
                <span class="mv-pane-label">Tabel</span>
                <div class="mv-trow mv-trow-head">
                  <span>Judul</span><span>Status</span>
                </div>
                <div class="mv-trow">
                  <span class="mv-card-title">Rilis modul pembayaran</span>
                  <span class="mv-tstatus">Proses</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── BAB 02: LAMPIRAN ────────────────────────────────────────── -->
          <div v-else-if="active === 1" class="scene-attach">
            <div class="att-card">
              <div class="att-card-head">
                <span class="att-card-title">Rilis modul pembayaran</span>
                <span class="att-card-state">Proses</span>
              </div>

              <div class="att-drop">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <span>Lepaskan file ke sini</span>
              </div>

              <div class="att-file">
                <span class="att-file-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </span>
                <span class="att-file-body">
                  <span class="att-file-name">spec-pembayaran-v3.pdf</span>
                  <span class="att-file-bar"><span class="att-file-bar-fill"></span></span>
                </span>
                <span class="att-file-check">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              </div>

              <div class="att-preview">
                <span class="att-preview-thumb"></span>
                <span class="att-preview-text">Pratinjau terbuka tanpa unduh ulang</span>
              </div>
            </div>
          </div>

          <!-- ─── BAB 03: KEDAULATAN DATA ────────────────────────────────── -->
          <div v-else class="scene-sovereignty">
            <div class="sov-panel">
              <div class="sov-head">
                <span class="sov-title">Baris tugas saya</span>
                <span class="sov-rls">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Row-Level Security
                </span>
              </div>

              <div class="sov-row">
                <span class="sov-lock">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <span class="sov-row-title">Rilis modul pembayaran</span>
                <span class="sov-row-owner">saya</span>
              </div>
              <div class="sov-row">
                <span class="sov-lock">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <span class="sov-row-title">Audit rasio kontras</span>
                <span class="sov-row-owner">saya</span>
              </div>

              <div class="sov-export">
                <div class="sov-export-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Ekspor JSON</span>
                </div>
                <div class="sov-export-file">
                  <span class="sov-export-name">taktvibe-ekspor.json</span>
                  <span class="sov-export-size">18 KB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Keterangan -->
    <div class="tour-caption">
      <span class="tour-caption-title">{{ scenes[active]?.captionTitle }}</span>
      <span class="tour-caption-text">{{ scenes[active]?.caption }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const scenes = [
  {
    num: 'Bab 01',
    label: 'Tiga Sudut Pandang',
    captionTitle: 'Satu data, tiga tampilan.',
    caption: 'Tugas yang sama berpindah bentuk: papan alur kerja, kalender tenggat, dan tabel ringkas.'
  },
  {
    num: 'Bab 02',
    label: 'Lampiran Terstruktur',
    captionTitle: 'Berkas menempel pada tugasnya.',
    caption: 'Dokumen dan media diunggah sekali, langsung terhubung ke kartu yang relevan.'
  },
  {
    num: 'Bab 03',
    label: 'Kedaulatan Data',
    captionTitle: 'Ekspor kapan pun, tanpa ketergantungan.',
    caption: 'Unduh seluruh riwayat sebagai JSON atau CSV. Isolasi baris memastikan hanya Anda yang melihat.'
  }
]

const duration = 6000
const active = ref(0)
const runId = ref(0)
const autoplay = ref(true)
const paused = ref(false)

const go = (index: number) => {
  active.value = index
  runId.value++
}

const next = () => {
  if (!autoplay.value) return
  go((active.value + 1) % scenes.length)
}

const pause = () => { paused.value = true }
const resume = () => { paused.value = false }

onMounted(() => {
  if (!import.meta.client) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    autoplay.value = false
  }
})

onBeforeUnmount(() => {
  autoplay.value = false
})
</script>

<style scoped>
.tour {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

html.light .tour {
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04);
}

/* ─── HEAD & TABS ─────────────────────────────────────────────────────────── */
.tour-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.tour-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tour-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.tour-tab:hover {
  color: var(--text-primary);
}

.tour-tab:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.15);
}

.tour-tab.active {
  background: var(--bg-elevated);
  border-color: var(--border-color);
  color: var(--text-heading);
  font-weight: 600;
}

.tour-tab-num {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.tour-tab.active .tour-tab-num {
  color: var(--accent-primary);
}

/* ─── PROGRESS ────────────────────────────────────────────────────────────── */
.tour-progress {
  display: flex;
  gap: 4px;
  padding: 0;
  background: var(--bg-surface);
}

.tour-seg {
  position: relative;
  flex: 1;
  height: 2px;
  background: var(--border-color);
  overflow: hidden;
}

.tour-seg-fill {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  background: var(--accent-primary);
  animation-name: tour-fill;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.tour.is-paused .tour-seg-fill {
  animation-play-state: paused;
}

@keyframes tour-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* ─── STAGE ───────────────────────────────────────────────────────────────── */
.tour-stage {
  padding: 22px;
  background: var(--bg-base);
  /* Dikunci setinggi scene terpanjang (Bab 02) agar panggung tidak melompat
     saat pergantian scene. */
  min-height: 300px;
  display: flex;
  align-items: center;
}

.tour-scene {
  width: 100%;
}

.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.tour-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tour-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ─── SHARED MOCK PIECES ──────────────────────────────────────────────────── */
.mv-card-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.35;
}

.mv-card-tag {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--color-warning);
  background: rgba(251, 191, 36, 0.12);
  align-self: flex-start;
}

/* ─── BAB 01: MULTI-VIEW ──────────────────────────────────────────────────── */
.mv-toolbar {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: fit-content;
  margin-bottom: 16px;
}

.mv-seg {
  padding: 4px 12px;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.mv-seg.is-on {
  background: var(--bg-elevated);
  color: var(--text-heading);
  font-weight: 600;
}

.mv-panes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mv-pane {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 150px;
}

.mv-pane-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Spotlight berpindah antar pane: satu siklus 4.8s, tiap pane menyala 1/3 siklus */
.mv-pane {
  animation: mv-focus 4.8s ease-in-out infinite;
}

.mv-kanban { animation-delay: 0s; }
.mv-calendar { animation-delay: 1.6s; }
.mv-table { animation-delay: 3.2s; }

@keyframes mv-focus {
  0%, 28% {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(0, 90, 251, 0.12);
  }
  33%, 100% {
    border-color: var(--border-color);
    box-shadow: none;
  }
}

.mv-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mv-col-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.mv-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mv-month {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-heading);
}

.mv-week {
  display: flex;
  gap: 6px;
}

.mv-day {
  flex: 1;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-height: 92px;
}

.mv-day-num {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-muted);
}

.mv-day.is-on {
  border-color: var(--color-warning);
  background: rgba(251, 191, 36, 0.07);
}

.mv-day.is-on .mv-day-num {
  color: var(--color-warning);
}

.mv-trow {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.mv-trow-head {
  background: transparent;
  border: none;
  padding: 2px 8px;
  font-weight: 600;
  color: var(--text-muted);
}

.mv-tstatus {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--accent-primary);
}

/* ─── BAB 02: LAMPIRAN ────────────────────────────────────────────────────── */
.att-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.att-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.att-card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-heading);
}

.att-card-state {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--accent-primary);
  background: rgba(0, 90, 251, 0.12);
}

.att-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  border: 1px dashed var(--border-subtle);
  border-radius: 8px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  background: var(--bg-surface);
  animation: att-drop-pulse 3s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

@keyframes att-drop-pulse {
  0%, 100% { border-color: var(--border-subtle); }
  40% { border-color: var(--accent-primary); color: var(--text-primary); }
}

.att-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  animation: att-file-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) 1.1s both;
}

@keyframes att-file-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.att-file-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  color: var(--accent-primary);
  flex-shrink: 0;
}

.att-file-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.att-file-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.att-file-bar {
  height: 3px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.att-file-bar-fill {
  display: block;
  height: 100%;
  background: var(--accent-primary);
  border-radius: 2px;
  transform-origin: left center;
  animation: att-bar 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1.3s both;
}

@keyframes att-bar {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.att-file-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(74, 222, 128, 0.14);
  color: var(--color-success);
  flex-shrink: 0;
  animation: att-check-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) 2.7s both;
}

@keyframes att-check-in {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}

.att-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  animation: att-file-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 3.2s both;
}

.att-preview-thumb {
  width: 44px;
  height: 34px;
  border-radius: 5px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.att-preview-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

/* ─── BAB 03: KEDAULATAN ──────────────────────────────────────────────────── */
.sov-panel {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.sov-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.sov-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-heading);
}

.sov-rls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 9999px;
  color: var(--color-success);
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.25);
}

.sov-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.8125rem;
  color: var(--text-primary);
  animation: sov-row-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.sov-row:nth-of-type(2) { animation-delay: 0.15s; }
.sov-row:nth-of-type(3) { animation-delay: 0.3s; }

@keyframes sov-row-in {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}

.sov-lock {
  display: inline-flex;
  color: var(--text-muted);
  flex-shrink: 0;
}

.sov-row-title {
  flex: 1;
  font-weight: 500;
}

.sov-row-owner {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.sov-export {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  flex-wrap: wrap;
}

.sov-export-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  animation: sov-press 3.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

@keyframes sov-press {
  0%, 20% { transform: scale(1); }
  8% { transform: scale(0.96); }
  16% { transform: scale(1); }
  100% { transform: scale(1); }
}

.sov-export-file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  animation: att-file-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.4s both;
}

.sov-export-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sov-export-size {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ─── CAPTION ─────────────────────────────────────────────────────────────── */
.tour-caption {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 14px 22px 18px;
  border-top: 1px solid var(--border-color);
  background: var(--card-bg);
  flex-wrap: wrap;
}

.tour-caption-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-heading);
}

.tour-caption-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

@media (max-width: 720px) {
  .tour-stage {
    min-height: 0;
    padding: 16px;
  }

  .mv-panes {
    grid-template-columns: 1fr;
  }

  .mv-pane {
    min-height: 0;
  }

  .mv-calendar {
    order: 3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tour-seg-fill,
  .mv-pane,
  .att-drop,
  .att-file,
  .att-file-bar-fill,
  .att-file-check,
  .att-preview,
  .sov-row,
  .sov-export-btn,
  .sov-export-file {
    animation: none !important;
  }

  .tour-fade-enter-active,
  .tour-fade-leave-active {
    transition: none;
  }
}
</style>
