<template>
  <div class="landing-page">
    <!-- ─── 1. MINIMAL TOP NAV ─────────────────────────────────────────────── -->
    <header class="site-header" :class="{ 'scrolled': isScrolled }">
      <div class="header-inner">
        <!-- Logo -->
        <NuxtLink to="/" class="brand-link" title="TaktVibe">
          <img src="/images/logo-icon.png" alt="TaktVibe" class="brand-icon" />
          <span class="brand-name">TaktVibe</span>
        </NuxtLink>

        <!-- Navigation Links -->
        <nav class="main-nav">
          <button
            v-for="link in navLinks"
            :key="link.target"
            type="button"
            class="nav-item"
            @click="scrollToSection(link.target)"
          >
            {{ link.label }}
          </button>
        </nav>

        <!-- Right Action Controls -->
        <div class="header-actions">
          <button
            type="button"
            class="theme-toggle-btn"
            @click="toggleTheme"
            :title="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
            :aria-label="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
          >
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          <template v-if="authStore.isAuthenticated">
            <NuxtLink to="/dashboard" class="btn-primary">
              <span>Ke Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="nav-login-link">
              Masuk
            </NuxtLink>
            <NuxtLink to="/register" class="btn-primary">
              <span>Mulai Gratis</span>
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- ─── 2. CALM & CONFIDENT HERO ───────────────────────────────────────── -->
    <section class="hero-section">
      <div class="hero-bg-grid" aria-hidden="true"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          <span>Ruang Kerja Personal Minimalis</span>
        </div>
        <h1 class="hero-title">
          Ruang tenang untuk menyelesaikan hal yang berarti.
        </h1>
        <p class="hero-subtitle">
          TaktVibe adalah ruang kerja personal yang cepat dan bebas distraksi. Menggabungkan kemudahan papan Kanban, kalender tenggat, dan catatan terstruktur dalam satu tempat.
        </p>

        <div class="hero-cta-wrap">
          <NuxtLink
            :to="authStore.isAuthenticated ? '/dashboard' : '/register'"
            class="btn-primary btn-large"
          >
            <span>{{ authStore.isAuthenticated ? 'Buka Dashboard' : 'Mulai Sekarang' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NuxtLink>

          <button type="button" class="btn-ghost btn-large" @click="scrollToSection('demo')">
            <span>Coba Interaktif</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        <!-- Auto Tour: Memoalkan cara kerja tiga fitur utama -->
        <ClientOnly>
          <component :is="FeatureTour" class="hero-tour" />
        </ClientOnly>
      </div>
    </section>

    <!-- ─── 3. THE FOCUS CANVAS: GENUINE LIVE WORKBENCH ─────────────────────── -->
    <section id="demo" class="canvas-section">
      <div class="focus-board reveal">
        <!-- Board Header -->
        <div class="board-header">
          <div class="board-heading-wrap">
            <span class="board-dot"></span>
            <span class="board-title">Fokus Hari Ini</span>
            <span class="board-status">{{ completedCount }} dari {{ tasks.length }} selesai</span>
          </div>

          <!-- Board Filters -->
          <div class="board-filter-group">
            <button
              type="button"
              class="filter-pill"
              :class="{ 'active': activeFilter === 'all' }"
              @click="activeFilter = 'all'"
            >
              Semua ({{ tasks.length }})
            </button>
            <button
              type="button"
              class="filter-pill"
              :class="{ 'active': activeFilter === 'active' }"
              @click="activeFilter = 'active'"
            >
              Aktif ({{ activeTasks.length }})
            </button>
            <button
              type="button"
              class="filter-pill"
              :class="{ 'active': activeFilter === 'done' }"
              @click="activeFilter = 'done'"
            >
              Selesai ({{ completedTasks.length }})
            </button>
          </div>
        </div>

        <!-- Task List Rows -->
        <div class="task-rows">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-row"
            :class="{ 'is-done': task.completed }"
            @click="toggleTask(task.id)"
          >
            <!-- Checkbox -->
            <button
              type="button"
              class="task-checkbox"
              :class="{ 'checked': task.completed }"
              :aria-label="task.completed ? 'Batalkan selesai' : 'Tandai selesai'"
              @click.stop="toggleTask(task.id)"
            >
              <svg v-if="task.completed" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>

            <!-- Title -->
            <span class="task-title-text">{{ task.title }}</span>

            <!-- Category & Due Date -->
            <div class="task-meta">
              <span class="task-tag">{{ task.space }}</span>
              <span v-if="task.hasAttachment" class="task-attachment-icon" title="Ada file lampiran">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </span>
              <span class="task-due-date">{{ task.dueDate }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Add Inline Field -->
        <form class="quick-add-wrap" @submit.prevent="handleAddTask">
          <div class="add-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <input
            v-model="newTaskInput"
            type="text"
            placeholder="Tambah tugas baru langsung di sini, lalu tekan Enter..."
            class="quick-add-input"
          />
          <button v-if="newTaskInput.trim()" type="submit" class="quick-add-btn">
            Tambah
          </button>
        </form>

        <!-- Subtle Board Note -->
        <div class="board-footnote">
          <span>Sentuh atau klik kartu tugas mana saja untuk memperbarui status secara langsung.</span>
        </div>
      </div>
    </section>

    <!-- ─── 4. EDITORIAL STORY VIGNETTES (UNNESTED & CLEAN) ────────────────── -->
    <section id="fitur" class="stories-section">
      <!-- Story 1: Tiga Sudut Pandang -->
      <div class="story-item reveal">
        <div class="story-narrative">
          <span class="story-eyebrow"><span class="story-eyebrow-dot"></span>Bab 01 Tiga Sudut Pandang</span>
          <h2 class="story-title">Tiga cara melihat pekerjaan Anda.</h2>
          <p class="story-desc">
            Kadang Anda memerlukan papan Kanban visual saat memproses alur kerja harian. Di hari lain, Anda memerlukan kalender bulanan untuk mengantisipasi tenggat waktu, atau tabel ringkas untuk melihat puluhan tugas sekaligus.
          </p>
          <p class="story-desc">
            TaktVibe menyediakan ketiganya dalam satu data terpadu tanpa perlu menduplikasi catatan Anda.
          </p>
        </div>

        <!-- Single clean unnested surface (no card-inside-card) -->
        <div class="story-preview-surface">
          <!-- Segmented Tab Toggle -->
          <div class="switch-tabs">
            <button
              type="button"
              class="view-tab"
              :class="{ 'active': previewView === 'kanban' }"
              @click="previewView = 'kanban'"
            >
              Papan Kanban
            </button>
            <button
              type="button"
              class="view-tab"
              :class="{ 'active': previewView === 'calendar' }"
              @click="previewView = 'calendar'"
            >
              Kalender
            </button>
            <button
              type="button"
              class="view-tab"
              :class="{ 'active': previewView === 'table' }"
              @click="previewView = 'table'"
            >
              Tabel
            </button>
          </div>

          <!-- Unnested View Showcase -->
          <div v-if="previewView === 'kanban'" class="snippet-kanban">
            <div class="snippet-col">
              <span class="snippet-col-label">Proses Pengerjaan</span>
              <div class="snippet-mini-card">
                <span class="mini-card-text">Integrasi API Storage Supabase</span>
                <span class="mini-card-tag">Prioritas Tinggi</span>
              </div>
            </div>
            <div class="snippet-col">
              <span class="snippet-col-label">Rampung</span>
              <div class="snippet-mini-card done">
                <span class="mini-card-text">Audit Rasio Kontras WCAG</span>
                <span class="mini-card-tag done-tag">Selesai</span>
              </div>
            </div>
          </div>

          <div v-else-if="previewView === 'calendar'" class="snippet-calendar">
            <div class="cal-mini-header">Oktober 2026</div>
            <div class="cal-mini-days">
              <span class="cal-mini-cell">01</span>
              <span class="cal-mini-cell active">02 <small>Deadline UI</small></span>
              <span class="cal-mini-cell">03</span>
              <span class="cal-mini-cell">04</span>
              <span class="cal-mini-cell">05</span>
            </div>
          </div>

          <div v-else class="snippet-table">
            <div class="table-mini-row head">
              <span>Judul</span>
              <span>Ruang</span>
              <span>Status</span>
            </div>
            <div class="table-mini-row">
              <span>Arsitektur Antarmuka Baru</span>
              <span>Design</span>
              <span class="text-success">Rampung</span>
            </div>
            <div class="table-mini-row">
              <span>Penyusunan Rencana Q4</span>
              <span>Produk</span>
              <span class="text-warning">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Story 2: Lampiran Dokumen & Media -->
      <div class="story-item reverse reveal">
        <div class="story-narrative">
          <span class="story-eyebrow"><span class="story-eyebrow-dot"></span>Bab 02 Lampiran Terstruktur</span>
          <h2 class="story-title">Lampiran dan dokumen di tempat yang tepat.</h2>
          <p class="story-desc">
            Sematkan tangkapan layar, bukti pengerjaan, atau file pendukung langsung di dalam kartu tugas. Tidak perlu mencari tautan terpisah di aplikasi perpesanan.
          </p>
          <p class="story-desc">
            Dilengkapi penampil gambar Lightbox bawaan agar Anda dapat meninjau aset secara instan tanpa harus mengunduh ulang.
          </p>
        </div>

        <!-- Single clean card, not nested -->
        <div class="attachment-preview-card">
          <div class="file-thumb">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div class="file-info">
            <span class="file-name">spec-antarmuka-v2.pdf</span>
            <span class="file-meta">Dokumen PDF · 2.4 MB · Tersimpan di Cloud</span>
          </div>
          <span class="file-badge">Tersimpan</span>
        </div>
      </div>

      <!-- Story 3: Kedaulatan & Keamanan Data -->
      <div id="kedaulatan" class="story-item reveal">
        <div class="story-narrative">
          <span class="story-eyebrow"><span class="story-eyebrow-dot"></span>Bab 03 Kedaulatan Data</span>
          <h2 class="story-title">Data Anda sepenuhnya milik Anda.</h2>
          <p class="story-desc">
            Tanpa keterikatan platform (*zero vendor lock-in*). Ekspor seluruh riwayat tugas Anda ke format CSV atau JSON kapan pun Anda inginkan.
          </p>
          <p class="story-desc">
            Setiap catatan dilindungi oleh isolasi akun mandiri (*Row-Level Security*), memastikan tidak ada orang lain yang dapat melihat tugas pribadi Anda.
          </p>
        </div>

        <!-- Single clean card, not nested -->
        <div class="export-preview-card">
          <div class="export-top">
            <span class="export-label">Format Ekspor Mandiri</span>
            <span class="export-status">Siap Diunduh</span>
          </div>
          <div class="export-buttons">
            <div class="export-chip">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Unduh JSON Lengkap</span>
            </div>
            <div class="export-chip">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Ekspor Tabel CSV</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── 5. QUIET INVITATION ────────────────────────────────────────────── -->
    <section class="invitation-section">
      <div class="invitation-inner">
        <h2 class="invitation-title">Mulai hari kerja Anda dengan lebih teratur.</h2>
        <p class="invitation-desc">
          Buka akun gratis dalam 30 detik. Tanpa biaya langganan, tanpa setup rumit.
        </p>

        <div class="invitation-actions">
          <NuxtLink
            :to="authStore.isAuthenticated ? '/dashboard' : '/register'"
            class="btn-primary btn-large"
          >
            <span>{{ authStore.isAuthenticated ? 'Buka Dashboard' : 'Daftar Akun Baru' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </NuxtLink>

          <NuxtLink v-if="!authStore.isAuthenticated" to="/login" class="btn-ghost btn-large">
            <span>Sudah Punya Akun? Masuk</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ─── 6. MINIMAL FOOTER ──────────────────────────────────────────────── -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-left">
          <NuxtLink to="/" class="brand-link small">
            <img src="/images/logo-icon.png" alt="TaktVibe" class="brand-icon small" />
            <span class="brand-name">TaktVibe</span>
          </NuxtLink>
          <span class="footer-tagline">Ruang kerja personal yang tenang dan terarah.</span>
        </div>

        <div class="footer-right">
          <NuxtLink to="/dashboard" class="footer-link">Dashboard</NuxtLink>
          <NuxtLink to="/login" class="footer-link">Masuk</NuxtLink>
          <NuxtLink to="/register" class="footer-link">Daftar</NuxtLink>
          <NuxtLink to="/forgot-password" class="footer-link">Lupa Sandi</NuxtLink>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; {{ currentYear }} TaktVibe. Dirancang untuk kejelasan dan fokus.</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useAuthStore } from '~/stores/authStore'
import { useTheme } from '~/composables/useTheme'
const FeatureTour = defineAsyncComponent(() => import('~/components/FeatureTour.vue'))

definePageMeta({
  title: 'Personal Task & Knowledge Management',
  layout: false
})

const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()

const currentYear = new Date().getFullYear()
const isScrolled = ref<boolean>(false)
const previewView = ref<'kanban' | 'calendar' | 'table'>('kanban')

const navLinks = [
  { label: 'Coba Konsol', target: 'demo' },
  { label: 'Fitur Utama', target: 'fitur' },
  { label: 'Privasi & Data', target: 'kedaulatan' }
]

const scrollToSection = (target: string) => {
  if (!import.meta.client) return
  const el = document.getElementById(target)
  if (!el) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start'
  })
}

// Live Focus Canvas Interactive State
interface LiveTask {
  id: string
  title: string
  space: string
  dueDate: string
  completed: boolean
  hasAttachment?: boolean
}

const tasks = ref<LiveTask[]>([
  {
    id: 't1',
    title: 'Penyusunan alur prioritas mingguan',
    space: 'Perencanaan',
    dueDate: 'Hari ini',
    completed: true,
    hasAttachment: false
  },
  {
    id: 't2',
    title: 'Tinjau desain antarmuka & rasio kontras',
    space: 'Desain',
    dueDate: 'Hari ini',
    completed: false,
    hasAttachment: true
  },
  {
    id: 't3',
    title: 'Uji coba sinkronisasi realtime antartab',
    space: 'Teknik',
    dueDate: 'Besok',
    completed: false,
    hasAttachment: false
  },
  {
    id: 't4',
    title: 'Ekspor cadangan data JSON ke arsip lokal',
    space: 'Data',
    dueDate: '05 Okt',
    completed: false,
    hasAttachment: true
  }
])

const activeFilter = ref<'all' | 'active' | 'done'>('all')
const newTaskInput = ref<string>('')

const completedTasks = computed(() => tasks.value.filter(t => t.completed))
const activeTasks = computed(() => tasks.value.filter(t => !t.completed))
const completedCount = computed(() => completedTasks.value.length)

const filteredTasks = computed(() => {
  if (activeFilter.value === 'active') return activeTasks.value
  if (activeFilter.value === 'done') return completedTasks.value
  return tasks.value
})

function toggleTask(id: string) {
  const task = tasks.value.find(t => t.id === id)
  if (task) {
    task.completed = !task.completed
  }
}

function handleAddTask() {
  const title = newTaskInput.value.trim()
  if (!title) return

  tasks.value.push({
    id: `custom-${Date.now()}`,
    title,
    space: 'Umum',
    dueDate: 'Hari ini',
    completed: false
  })
  newTaskInput.value = ''
}

const handleScroll = () => {
  if (import.meta.client) {
    isScrolled.value = window.scrollY > 20
  }
}

// Reveal on scroll: satu observer untuk seluruh elemen .reveal
let revealObserver: IntersectionObserver | null = null

const setupReveal = () => {
  if (!import.meta.client) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const targets = document.querySelectorAll('.reveal')
  if (!targets.length) return
  document.documentElement.classList.add('has-reveal')
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          revealObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  )
  targets.forEach(el => revealObserver!.observe(el))
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('scroll', handleScroll, { passive: true })
    setupReveal()
    // Bersihkan parameter error OAuth agar tidak terus muncul
    const url = new URL(window.location.href)
    if (url.searchParams.has('error') || url.searchParams.has('code') || url.searchParams.has('access_token') || url.searchParams.has('refresh_token') || url.hash.includes('access_token')) {
      url.search = ''
      if (url.hash) history.replaceState(null, '', url.pathname)
      else window.history.replaceState({}, '', url.toString())
    }
    // Jika sudah login dan kembali dari OAuth, arahkan ke dashboard
    const supabase = useSupabaseClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && window.location.pathname === '/') {
        navigateTo('/dashboard', { replace: true })
      }
    }).catch(() => {})
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
  }
  revealObserver?.disconnect()
  if (import.meta.client) {
    document.documentElement.classList.remove('has-reveal')
  }
})
</script>

<style scoped>
/* ─── BASE RESET & PALETTE ───────────────────────────────────────────────── */
.landing-page {
  min-height: 100vh;
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* ─── REVEAL ON SCROLL ────────────────────────────────────────────────────── */
/* State tersembunyi hanya aktif bila JS menyiapkan observer (html.has-reveal),
   sehingga konten tetap terlihat bila JS gagal atau dimatikan. */
html.has-reveal .reveal {
  opacity: 0;
  transform: translateY(18px);
}

html.has-reveal .reveal.is-revealed {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ─── 1. TOP NAV ─────────────────────────────────────────────────────────── */
/* Keeps anchored sections clear of the sticky header when scrolled to */
#demo,
#fitur,
#kedaulatan {
  scroll-margin-top: 84px;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: var(--bg-base);
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.site-header.scrolled {
  background: rgba(9, 13, 22, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom-color: var(--border-color);
}

html.light .site-header.scrolled {
  background: rgba(255, 255, 255, 0.94);
}

.header-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.brand-icon.small {
  width: 20px;
  height: 20px;
}

.brand-name {
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-heading);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-item {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  background: transparent;
  border: none;
  padding: 4px 0;
  cursor: pointer;
  transition: color 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-item:hover {
  color: var(--text-primary);
}

.nav-item:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--accent-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background-color 0.15s;
}

.theme-toggle-btn:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
  border-color: var(--border-subtle);
}

.nav-login-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}

.nav-login-link:hover {
  color: var(--text-primary);
}

/* ─── BUTTONS ────────────────────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--accent-primary);
  color: #ffffff;
  border: 1px solid var(--accent-primary);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
  border-color: var(--accent-primary-hover);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s, border-color 0.15s;
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--bg-surface);
  border-color: var(--border-subtle);
}

.btn-large {
  padding: 12px 24px;
  font-size: 0.9375rem;
}

/* ─── 2. HERO SECTION ────────────────────────────────────────────────────── */
.hero-section {
  position: relative;
  padding: 88px 24px 52px;
  text-align: center;
  overflow: hidden;
}

.hero-bg-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 80%);
}

html.light .hero-bg-grid {
  background-image:
    linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
}

.hero-content {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
}

.hero-tour {
  margin-top: 52px;
  text-align: left;
  animation: hero-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.34s both;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-soft);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  animation: hero-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
}

.hero-title {
  font-size: clamp(2.3rem, 5.5vw, 3.8rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.035em;
  color: var(--text-heading);
  margin: 0 0 22px;
  animation: hero-fade-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 auto 36px;
  max-width: 620px;
  animation: hero-fade-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both;
}

.hero-cta-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  animation: hero-fade-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both;
}

@keyframes hero-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .board-dot::after {
    animation: none;
  }

  .focus-board,
  .focus-board:hover {
    transform: none;
    transition: none;
  }

  .hero-badge,
  .hero-title,
  .hero-subtitle,
  .hero-cta-wrap,
  .hero-tour {
    animation: none;
  }
}

/* ─── 3. THE FOCUS CANVAS (NATURAL ELEVATION, NO WIDE SHADOW) ────────────── */
.canvas-section {
  padding: 36px 24px 84px;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
}

.focus-board {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-top: 2px solid var(--accent-primary);
  border-radius: 12px;
  /* NATURAL ELEVATION COMPLIANT WITH AGENTS.md (No giant 32px diffuse glow) */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.focus-board:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16), 0 8px 24px rgba(0, 0, 0, 0.1);
}

html.light .focus-board {
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04);
}

html.light .focus-board:hover {
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 8px 24px rgba(15, 23, 42, 0.06);
}

.board-header {
  padding: 16px 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.board-heading-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.board-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  position: relative;
}

.board-dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid var(--color-success);
  opacity: 0.6;
  animation: pulse-ring 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 0.8; }
  70%, 100% { transform: scale(2.2); opacity: 0; }
}

.board-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-heading);
}

.board-status {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.board-filter-group {
  display: flex;
  gap: 6px;
}

.filter-pill {
  padding: 5px 12px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.filter-pill:hover {
  color: var(--text-primary);
}

.filter-pill.active {
  background: var(--bg-elevated);
  border-color: var(--border-color);
  color: var(--text-heading);
  font-weight: 600;
}

.task-rows {
  display: flex;
  flex-direction: column;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.task-row:hover {
  background: var(--bg-surface);
}

.task-checkbox {
  width: 19px;
  height: 19px;
  border-radius: 4px;
  border: 1.5px solid var(--border-subtle);
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s, border-color 0.15s;
}

.task-checkbox.checked {
  background: var(--color-success);
  border-color: var(--color-success);
}

.task-title-text {
  font-size: 0.9375rem;
  color: var(--text-primary);
  flex-grow: 1;
  transition: color 0.15s;
}

.task-row.is-done .task-title-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.task-tag {
  padding: 4px 9px;
  border-radius: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.task-attachment-icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.task-due-date {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.quick-add-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--bg-base);
}

.add-icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.quick-add-input {
  flex-grow: 1;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--text-primary);
  outline: none;
}

.quick-add-input::placeholder {
  color: var(--text-muted);
}

.quick-add-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--accent-primary);
  color: #ffffff;
  border: none;
  cursor: pointer;
}

.board-footnote {
  padding: 12px 20px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.5;
}

/* ─── 4. EDITORIAL STORIES (UNNESTED & ACCESSIBLE) ────────────────────────── */
.stories-section {
  padding: 64px 24px 96px;
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 96px;
}

.story-item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}

.story-item.reverse {
  direction: rtl;
}

.story-item.reverse .story-narrative,
.story-item.reverse .attachment-preview-card {
  direction: ltr;
}

.story-narrative {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.story-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
  margin-bottom: -4px;
}

.story-eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
  flex-shrink: 0;
}

.story-title {
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.025em;
  color: var(--text-heading);
  margin: 0;
}

.story-desc {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* ─── UNNESTED PREVIEW SURFACE (NO NESTED CARDS) ─────────────────────────── */
.story-preview-surface {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.switch-tabs {
  display: flex;
  gap: 6px;
  background: var(--bg-surface);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.view-tab {
  flex: 1;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
  font-family: inherit;
}

.view-tab.active {
  background: var(--bg-elevated);
  color: var(--text-heading);
  font-weight: 600;
}

/* Kanban snippet (Direct, unnested) */
.snippet-kanban {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.snippet-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snippet-col-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.snippet-mini-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-card-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
}

/* Functional tags: min 13px, high-contrast accessible */
.mini-card-tag {
  font-size: 0.8125rem;
  color: var(--color-warning);
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(251, 191, 36, 0.12);
  align-self: flex-start;
}

.mini-card-tag.done-tag {
  color: var(--color-success);
  background: rgba(74, 222, 128, 0.12);
}

.snippet-mini-card.done .mini-card-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Calendar snippet */
.snippet-calendar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cal-mini-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-heading);
}

.cal-mini-days {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.cal-mini-cell {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cal-mini-cell.active {
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.cal-mini-cell small {
  font-size: 0.75rem;
  color: var(--color-warning);
  font-weight: 500;
}

/* Table snippet */
.snippet-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.table-mini-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.table-mini-row.head {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--text-muted);
  background: var(--bg-surface);
}

.table-mini-row:last-child {
  border-bottom: none;
}

/* Story 2 Attachment: Single unnested card */
.attachment-preview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.file-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
}

.file-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.file-meta {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.file-badge {
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(74, 222, 128, 0.12);
  color: var(--color-success);
}

/* Story 3 Export: Single unnested card */
.export-preview-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.export-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.export-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-heading);
}

.export-status {
  font-size: 0.8125rem;
  color: var(--color-success);
  font-weight: 600;
}

.export-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.export-chip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* ─── 5. QUIET INVITATION ────────────────────────────────────────────────── */
.invitation-section {
  padding: 80px 24px 96px;
  text-align: center;
  border-top: 1px solid var(--border-color);
  background: var(--bg-surface);
}

.invitation-inner {
  max-width: 600px;
  margin: 0 auto;
}

.invitation-title {
  font-size: clamp(1.8rem, 3.5vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-heading);
  margin: 0 0 14px;
  line-height: 1.2;
}

.invitation-desc {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 auto 32px;
}

.invitation-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ─── 6. MINIMAL FOOTER ──────────────────────────────────────────────────── */
.site-footer {
  margin-top: auto;
  background: var(--bg-base);
  border-top: 1px solid var(--border-color);
  padding: 40px 24px 28px;
}

.footer-inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-tagline {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-link {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link:hover {
  color: var(--text-primary);
}

.footer-bottom {
  max-width: 1080px;
  margin: 20px auto 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* ─── RESPONSIVE BREAKPOINTS ─────────────────────────────────────────────── */
@media (max-width: 860px) {
  .story-item,
  .story-item.reverse {
    grid-template-columns: 1fr;
    gap: 36px;
    direction: ltr;
  }

  .main-nav {
    display: none;
  }

  .header-inner {
    padding: 14px 20px;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 60px 20px 36px;
  }

  .task-meta {
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .board-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .footer-right {
    flex-wrap: wrap;
    gap: 14px;
  }
}
</style>
