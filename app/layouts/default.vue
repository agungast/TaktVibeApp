<template>
  <div class="admin-layout">
    <!-- Mobile Sidebar Backdrop Overlay -->
    <div
      v-if="!sidebarCollapsed"
      class="mobile-sidebar-backdrop"
      @click="closeMobileSidebar"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'mobile-open': !sidebarCollapsed }">
      <!-- Logo -->
      <div class="sidebar-logo">
        <NuxtLink to="/" class="logo-brand-group" title="TaktVibe">
          <div class="logo-icon-wrap">
            <img src="/images/logo-icon.png" alt="TaktVibe Emblem" class="logo-icon-img" />
          </div>
          <div class="logo-text-wrapper">
            <img src="/images/logo-horizontal-dark.png" alt="TaktVibe" class="logo-wordmark-img dark-only" />
            <img src="/images/logo-horizontal-light.png" alt="TaktVibe" class="logo-wordmark-img light-only" />
          </div>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <p class="nav-label">MENU</p>
        <NuxtLink to="/" class="nav-item active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span class="nav-item-text">Dashboard</span>
        </NuxtLink>

        <div class="nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span class="nav-item-text">Semua Tugas</span>
          <span class="nav-badge">{{ tasks?.length || 0 }}</span>
        </div>

        <div class="nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span class="nav-item-text">Selesai</span>
          <span class="nav-badge success">{{ completedCount }}</span>
        </div>

        <div class="nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span class="nav-item-text">Aktif</span>
          <span class="nav-badge warning">{{ activeCount }}</span>
        </div>

        <!-- ─── SPACES SECTION (SoloFlow Phase 4: Notion-style Spaces) ─── -->
        <div class="sidebar-spaces-section">
          <div class="spaces-header">
            <p class="nav-label">SPACES</p>
            <button
              type="button"
              class="add-space-btn"
              @click="taskStore.openProjectModal()"
              title="Tambah Ruang Kerja Baru"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <!-- Semua Ruang Kerja (All Tasks) -->
          <div
            class="nav-item space-item"
            :class="{ active: !activeProjectId }"
            @click="taskStore.setActiveProject(null); handleMobileNavClick()"
            title="Semua Ruang Kerja"
          >
            <span class="space-icon-wrap">🌐</span>
            <span class="nav-item-text">Semua Ruang Kerja</span>
            <span class="nav-badge">{{ tasks?.length || 0 }}</span>
          </div>

          <!-- Daftar Spaces Pengguna -->
          <div
            v-for="proj in (projects || [])"
            :key="proj.id"
            class="nav-item space-item custom-space"
            :class="{ active: activeProjectId === proj.id }"
            @click="taskStore.setActiveProject(proj.id); handleMobileNavClick()"
            :title="proj.name"
          >
            <span class="space-icon-wrap">{{ proj.icon }}</span>
            <span class="nav-item-text">{{ proj.name }}</span>
            <span
              class="space-dot"
              :style="{ background: proj.color }"
              :title="proj.name"
            ></span>
            <span class="nav-badge space-count">
              {{ taskStore.getProjectTaskCount(proj.id) }}
            </span>

            <!-- Actions on Hover (Edit & Delete) -->
            <div class="space-hover-actions" @click.stop>
              <button
                type="button"
                class="space-action-btn"
                @click.stop="taskStore.openProjectModal(proj)"
                title="Edit Ruang Kerja"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                type="button"
                class="space-action-btn delete"
                @click.stop="confirmDeleteProject(proj)"
                title="Hapus Ruang Kerja"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer (User info & Logout) -->
      <div class="sidebar-footer">
        <div
          class="user-info clickable"
          @click="authStore?.openProfileModal"
          :title="sidebarCollapsed ? `${authStore?.displayName || 'User'} (Klik untuk Edit Profil)` : 'Klik untuk Edit Profil'"
        >
          <div class="user-avatar">
            <img v-if="authStore?.avatarUrl" :src="authStore?.avatarUrl" alt="Avatar" class="sidebar-avatar-img" />
            <span v-else>{{ authStore?.userInitials || 'U' }}</span>
          </div>
          <div class="user-meta">
            <div class="user-name-row">
              <span class="user-name" :title="authStore?.userEmail || ''">{{ authStore?.displayName || 'User' }}</span>
              <svg class="edit-hint-icon" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <span class="user-role">{{ authStore?.userEmail || 'Supabase User' }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout" :disabled="authStore?.loading" :title="sidebarCollapsed ? 'Keluar (Sign Out)' : undefined">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span class="logout-text">Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Main Area -->
    <div class="main-area">
      <!-- Topbar -->
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <!-- Page Content via Slot -->
      <slot />
    </div>

    <!-- Modals (ClientOnly) -->
    <ClientOnly>
      <ImageLightbox
        :image-url="lightboxImage"
        :items="taskStore?.lightboxItems || []"
        :current-index="taskStore?.lightboxIndex || 0"
        @next="taskStore?.nextLightboxImage"
        @prev="taskStore?.prevLightboxImage"
        @close="taskStore?.closeLightbox"
      />
      <TaskDetailModal />
      <ProjectModal />
      <AttachmentModal />
      <ProfileModal />
      <LogoutModal />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '~/stores/taskStore'
import { useAuthStore } from '~/stores/authStore'

const { $pinia } = useNuxtApp()
const taskStore = useTaskStore($pinia)
const authStore = useAuthStore($pinia)

const {
  tasks,
  projects,
  activeProjectId,
  sidebarCollapsed,
  lightboxImage,
  completedCount,
  activeCount
} = storeToRefs(taskStore)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (import.meta.client) {
    localStorage.setItem('taktvibe_sidebar_collapsed', sidebarCollapsed.value ? 'true' : 'false')
  }
}

const closeMobileSidebar = () => {
  sidebarCollapsed.value = true
}

const handleMobileNavClick = () => {
  if (import.meta.client && window.innerWidth <= 768) {
    sidebarCollapsed.value = true
  }
}

const handleLogout = () => {
  authStore.openLogoutModal()
}

const confirmDeleteProject = async (proj: any) => {
  if (confirm(`Apakah Anda yakin ingin menghapus ruang kerja "${proj.name}"? Tugas di dalamnya akan tetap tersimpan.`)) {
    await taskStore.deleteProject(proj.id)
  }
}

// Keyboard shortcut: Ctrl + B or Cmd + B to toggle sidebar
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    toggleSidebar()
  }
}

onMounted(() => {
  if (import.meta.client) {
    if (window.innerWidth <= 768) {
      sidebarCollapsed.value = true
    } else {
      const saved = localStorage.getItem('taktvibe_sidebar_collapsed') ?? localStorage.getItem('taskflow_sidebar_collapsed')
      if (saved !== null) {
        sidebarCollapsed.value = saved === 'true'
      }
    }
  }
  taskStore.fetchProjects()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base, #090d16);
  color: var(--text-primary, #f1f5f9);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ─── SIDEBAR ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: #0f172a;
  border-right: 1px solid #1f2a3f;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 200;
}

/* Ketika di-minimize secara default lebarnya 70px */
.sidebar.sidebar-collapsed {
  width: 70px;
  min-width: 70px;
}

/* Saat cursor hover ke sidebar yang ter-minimize: Otomatis maximize ke 240px */
.sidebar.sidebar-collapsed:hover {
  width: 240px;
  min-width: 240px;
  box-shadow: 16px 0 40px rgba(0, 0, 0, 0.7);
}

/* Logo Area */
.sidebar-logo {
  display: flex;
  align-items: center;
  padding: 16px 16px;
  border-bottom: 1px solid #1f2a3f;
  height: 60px;
  box-sizing: border-box;
}

.sidebar.sidebar-collapsed:not(:hover) .sidebar-logo {
  justify-content: center;
  padding: 16px 10px;
}

.logo-brand-group {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
}

.logo-icon-wrap {
  width: 32px;
  height: 32px;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.logo-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.logo-text-wrapper {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.logo-wordmark-img {
  height: 20px;
  width: auto;
  object-fit: contain;
  display: block;
}

.sidebar.sidebar-collapsed:not(:hover) .logo-text-wrapper {
  display: none !important;
}

.sidebar.sidebar-collapsed:not(:hover) .logo-icon-wrap {
  margin: 0 auto;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.06em;
  padding: 6px 10px 4px;
  margin: 0;
  white-space: nowrap;
}

.sidebar.sidebar-collapsed:not(:hover) .nav-label {
  display: none;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
  cursor: pointer;
}

.nav-item:hover {
  background: #172136;
  color: #f1f5f9;
  border-color: #243048;
}

.nav-item.active {
  background: #1a253c;
  border-color: #2e3e5e;
  color: #ffffff;
  font-weight: 600;
}

.nav-item svg {
  flex-shrink: 0;
}

.nav-badge {
  margin-left: auto;
  background: #111726;
  border: 1px solid #1f2a3f;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 12px;
}

.nav-badge.success {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.25);
  color: #4ade80;
}

.nav-badge.warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

/* Ketika collapsed & TIDAK di-hover: item navigasi terpusat dan teks tersembunyi */
.sidebar.sidebar-collapsed:not(:hover) .nav-item {
  justify-content: center;
  padding: 11px 0;
}

.sidebar.sidebar-collapsed:not(:hover) .nav-item-text,
.sidebar.sidebar-collapsed:not(:hover) .nav-badge {
  display: none;
}

/* Spaces Section */
.sidebar-spaces-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #172136;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.spaces-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 6px;
}

.sidebar.sidebar-collapsed:not(:hover) .spaces-header {
  display: none;
}

.add-space-btn {
  background: transparent;
  border: 1px solid #1f2a3f;
  border-radius: 4px;
  color: #94a3b8;
  padding: 3px 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.add-space-btn:hover {
  color: #f1f5f9;
  background: #172136;
  border-color: #2d3b55;
}

.space-item {
  cursor: pointer;
}

.space-icon-wrap {
  font-size: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.space-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 2px;
}

.space-count {
  margin-left: auto;
}

.space-hover-actions {
  display: none;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.custom-space:hover .space-count {
  display: none;
}

.custom-space:hover .space-hover-actions {
  display: flex;
}

.space-action-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}

.space-action-btn:hover {
  color: #f1f5f9;
  background: #243048;
}

.space-action-btn.delete:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
}

.sidebar.sidebar-collapsed:not(:hover) .space-dot,
.sidebar.sidebar-collapsed:not(:hover) .space-count,
.sidebar.sidebar-collapsed:not(:hover) .space-hover-actions {
  display: none;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 14px 12px;
  border-top: 1px solid #1f2a3f;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #0b1120;
}

.sidebar.sidebar-collapsed:not(:hover) .sidebar-footer {
  padding: 14px 8px;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info.clickable {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.user-info.clickable:hover {
  background: #172136;
  border-color: #243048;
}

.user-info.clickable:hover .edit-hint-icon {
  color: #f1f5f9;
  opacity: 1;
}

.sidebar.sidebar-collapsed:not(:hover) .user-info {
  justify-content: center;
  margin: 0;
  padding: 0;
}

.user-avatar {
  width: 34px;
  height: 34px;
  background: #111726;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  flex-shrink: 0;
  overflow: hidden;
  border: 1.5px solid #2d3b55;
  transition: border-color 0.15s ease;
}

.user-info.clickable:hover .user-avatar {
  border-color: var(--accent-primary, #005afb);
}

.sidebar-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-meta {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-hint-icon {
  color: #94a3b8;
  opacity: 0.7;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.sidebar.sidebar-collapsed:not(:hover) .user-meta {
  display: none;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
  color: #fca5a5;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  font-family: inherit;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.sidebar.sidebar-collapsed:not(:hover) .logout-btn {
  justify-content: center;
  padding: 8px;
  width: 36px;
  height: 36px;
  margin: 0 auto;
}

.sidebar.sidebar-collapsed:not(:hover) .logout-text {
  display: none;
}

/* ─── MAIN AREA ───────────────────────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-x: hidden;
  background: var(--bg-base, #090d16);
  transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Mobile Sidebar Backdrop */
.mobile-sidebar-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .mobile-sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(4, 7, 13, 0.72);
    backdrop-filter: blur(4px);
    z-index: 290;
    transition: opacity 0.2s ease;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh;
    z-index: 300;
    width: 260px !important;
    min-width: 260px !important;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: none;
    display: flex !important;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
    box-shadow: 16px 0 40px rgba(0, 0, 0, 0.8);
  }

  .sidebar.sidebar-collapsed:not(.mobile-open) {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open .logo-text-wrapper,
  .sidebar.mobile-open .nav-label,
  .sidebar.mobile-open .user-meta,
  .sidebar.mobile-open .logout-text {
    display: block !important;
  }
}
</style>

