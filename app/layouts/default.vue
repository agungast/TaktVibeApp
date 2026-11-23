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
        <NuxtLink to="/dashboard" class="logo-brand-group" title="TaktVibe">
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
        <NuxtLink to="/dashboard" class="nav-item" :class="{ active: isFilter('all') }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span class="nav-item-text">Tugas Saya</span>
          <span class="nav-badge">{{ tasks?.length || 0 }}</span>
        </NuxtLink>

        <NuxtLink to="/analytics" class="nav-item" :class="{ active: route.path === '/analytics' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span class="nav-item-text">Analitik & Briefing</span>
        </NuxtLink>

        <NuxtLink :to="{ path: '/dashboard', query: { filter: 'done' } }" class="nav-item" :class="{ active: isFilter('done') }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span class="nav-item-text">Selesai</span>
          <span class="nav-badge success">{{ completedCount }}</span>
        </NuxtLink>

        <NuxtLink :to="{ path: '/dashboard', query: { filter: 'active' } }" class="nav-item" :class="{ active: isFilter('active') }">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span class="nav-item-text">Aktif</span>
          <span class="nav-badge warning">{{ activeCount }}</span>
        </NuxtLink>

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
            <span class="space-icon-wrap" aria-hidden="true"></span>
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

            <!-- Actions on Hover (Wiki, Edit & Delete) -->
            <div class="space-hover-actions" @click.stop>
              <button
                type="button"
                class="space-action-btn"
                @click.stop="taskStore.openProjectNotes(proj)"
                title="Wiki & Catatan"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </button>
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
            <img
              v-if="authStore?.avatarUrl && !sidebarAvatarErrored"
              :key="authStore?.avatarUrl"
              :src="authStore?.avatarUrl"
              alt="Avatar"
              class="sidebar-avatar-img"
              @error="onSidebarAvatarError"
              referrerpolicy="no-referrer"
              crossorigin="anonymous"
            />
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
      <CommandPalette />
      <TaktVibeCopilot ref="copilotRef" />
      <button type="button" class="copilot-fab" @click="copilotRef?.open?.()" title="Buka TaktVibe Copilot">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
          <rect x="3" y="8" width="18" height="12" rx="2"></rect>
          <path d="M9 13v2"></path>
          <path d="M15 13v2"></path>
        </svg>
      </button>
      <TaskDetailModal />
      <ProjectModal />
      <ProjectNotesModal />
      <AttachmentModal />
      <ProfileModal />
      <LogoutModal />
      <FocusTimer />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '~/stores/taskStore'
import { useAuthStore } from '~/stores/authStore'
import ProjectNotesModal from '~/components/ProjectNotesModal.vue'
import CommandPalette from '~/components/CommandPalette.vue'
import TaktVibeCopilot from '~/components/TaktVibeCopilot.vue'

const copilotRef = ref<InstanceType<typeof TaktVibeCopilot> | null>(null)

const { $pinia } = useNuxtApp()
const taskStore = useTaskStore($pinia)
const authStore = useAuthStore($pinia)
const route = useRoute()

const sidebarAvatarErrored = ref(false)
const onSidebarAvatarError = (e: Event) => {
  sidebarAvatarErrored.value = true
  const target = e.target as HTMLImageElement
  if (target) target.style.display = 'none'
}
watch(() => authStore?.avatarUrl, (newUrl, oldUrl) => {
  // Reset error state HANYA jika URL benar-benar berganti ke URL baru yang berbeda
  // Jangan reset jika URL sama — mencegah broken image infinite loop setelah session refresh
  if (newUrl && newUrl !== oldUrl) {
    sidebarAvatarErrored.value = false
  }
})

// Sidebar "Semua / Selesai / Aktif" memakai query filter yang sama dengan dashboard.
const isFilter = (value: 'all' | 'done' | 'active'): boolean => {
  if (route.path !== '/dashboard') return false
  const current = String(route.query.filter || 'all')
  return current === value
}

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
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Sidebar sits on the same plane as the canvas. */
.sidebar {
  width: 246px;
  min-width: 246px;
  background: var(--bg-base);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 200;
}
.sidebar.sidebar-collapsed { width: 64px; min-width: 64px; }

.sidebar-logo {
  height: 64px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.sidebar.sidebar-collapsed:not(:hover) .sidebar-logo { justify-content: center; padding: 14px 8px; }
.logo-brand-group { display: flex; align-items: center; gap: 10px; text-decoration: none; user-select: none; }
.logo-icon-wrap { width: 32px; height: 32px; border-radius: var(--radius-control); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.logo-icon-img { width: 100%; height: 100%; object-fit: contain; display: block; }
.logo-text-wrapper { display: flex; align-items: center; overflow: hidden; }
.logo-wordmark-img { height: 18px; width: auto; display: block; }
.sidebar.sidebar-collapsed:not(:hover) .logo-text-wrapper { display: none; }

.sidebar-nav {
  flex: 1;
  padding: 8px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
}
.nav-label {
  margin: 18px 0 6px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
}
.sidebar-nav > .nav-label:first-child { margin-top: 6px; }
.sidebar.sidebar-collapsed:not(:hover) .nav-label,
.sidebar.sidebar-collapsed:not(:hover) .spaces-header { display: none; }

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 5px 10px;
  border-radius: var(--radius-control);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.nav-item.active { background: var(--bg-active); color: var(--text-primary); font-weight: 500; }
.nav-item svg { flex-shrink: 0; opacity: 0.85; }
.nav-item.active svg { opacity: 1; }
.nav-item-text { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.nav-badge {
  margin-left: auto;
  flex-shrink: 0;
  min-width: 22px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--badge-bg);
  color: var(--badge-text);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.nav-badge.success { color: var(--color-success); }
.nav-badge.warning { color: var(--color-warning); }

.sidebar.sidebar-collapsed:not(:hover) .nav-item { justify-content: center; padding: 5px 0; }
.sidebar.sidebar-collapsed:not(:hover) .nav-item-text,
.sidebar.sidebar-collapsed:not(:hover) .nav-badge,
.sidebar.sidebar-collapsed:not(:hover) .space-dot,
.sidebar.sidebar-collapsed:not(:hover) .space-count,
.sidebar.sidebar-collapsed:not(:hover) .space-hover-actions { display: none; }

.sidebar-spaces-section {
  margin-top: 22px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.spaces-header { display: flex; align-items: center; justify-content: space-between; padding-right: 6px; }
.add-space-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-control);
  color: var(--text-secondary);
  padding: 3px 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 150ms ease, color 150ms ease;
}
.add-space-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.space-item { cursor: pointer; }
.space-icon-wrap { width: 16px; height: 16px; font-size: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.space-icon-wrap::before {
  content: '';
  width: 8px;
  height: 8px;
  border: 1.5px solid currentColor;
  border-radius: 2px;
  color: var(--text-secondary);
}
.space-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-left: 2px; }
.space-count { margin-left: auto; }
.space-hover-actions { display: none; align-items: center; gap: 2px; margin-left: auto; flex-shrink: 0; }
.custom-space:hover .space-count { display: none; }
.custom-space:hover .space-hover-actions { display: flex; }
.space-action-btn {
  background: transparent;
  border: 0;
  color: var(--text-muted);
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  transition: background-color 150ms ease, color 150ms ease;
}
.space-action-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.space-action-btn.delete:hover { color: var(--color-danger); }

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.user-info { display: flex; align-items: center; gap: 10px; }
.user-info.clickable { cursor: pointer; padding: 6px 8px; border-radius: var(--radius-control); transition: background-color 150ms ease; }
.user-info.clickable:hover { background: var(--bg-hover); }
.user-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  background: var(--bg-active);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  flex-shrink: 0;
}
.sidebar-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.user-meta { display: flex; flex-direction: column; overflow: hidden; }
.user-name-row { display: flex; align-items: center; gap: 6px; }
.edit-hint-icon { color: var(--text-muted); opacity: 0; transition: opacity 150ms ease; flex-shrink: 0; }
.user-info.clickable:hover .edit-hint-icon { color: var(--text-primary); opacity: 1; }
.user-name { font-size: 13px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar.sidebar-collapsed:not(:hover) .user-info { justify-content: center; padding: 0; }
.sidebar.sidebar-collapsed:not(:hover) .user-meta { display: none; }

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}
.logout-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.logout-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(29, 95, 191, 0.18); }
.sidebar.sidebar-collapsed:not(:hover) .logout-btn { justify-content: center; padding: 6px; width: 36px; }
.sidebar.sidebar-collapsed:not(:hover) .logout-text { display: none; }

.main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg-base); }
.mobile-sidebar-backdrop { display: none; }

.copilot-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--accent-primary);
  color: var(--bg-surface);
  cursor: pointer;
  z-index: 99990;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 150ms ease, opacity 150ms ease;
}
.copilot-fab:hover { opacity: 0.88; }
.copilot-fab:active { transform: scale(0.96); }
.copilot-fab:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(29, 95, 191, 0.25); }

@media (max-width: 768px) {
  .mobile-sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(17, 19, 22, 0.5); z-index: 290; }
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
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
    display: flex !important;
  }
  .sidebar.mobile-open { transform: translateX(0); box-shadow: 12px 0 32px rgba(17, 19, 22, 0.18); }
  .sidebar.sidebar-collapsed:not(.mobile-open) { transform: translateX(-100%); }
  .sidebar.mobile-open .logo-text-wrapper,
  .sidebar.mobile-open .nav-label,
  .sidebar.mobile-open .user-meta,
  .sidebar.mobile-open .logout-text { display: block !important; }
}
</style>
