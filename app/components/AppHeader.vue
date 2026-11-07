<template>
  <header class="topbar">
    <!-- Left: Toggle + Breadcrumb -->
    <div class="topbar-left">
      <button class="toggle-btn" @click="emit('toggle-sidebar')" title="Toggle Sidebar (Ctrl+B)">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div class="breadcrumb">
        <span class="breadcrumb-root">TaktVibe</span>
        <svg class="breadcrumb-sep" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span class="breadcrumb-current">Dashboard</span>
      </div>
    </div>

    <!-- Right: Search + User Menu -->
    <div class="topbar-right">
      <div class="search-box">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          id="global-search-input"
          ref="searchInputRef"
          v-model="taskStore.searchQuery"
          type="text"
          placeholder="Cari tugas..."
          class="search-input"
        />
        <kbd class="search-kbd">⌘K</kbd>
      </div>

      <!-- Theme Mode Toggle Button -->
      <button
        id="theme-toggle-btn"
        class="theme-toggle-btn"
        @click="toggleTheme"
        :title="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
        :aria-label="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
      >
        <!-- Sun icon: shown when dark, click to switch to light -->
        <svg
          v-if="isDark"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="theme-icon sun-icon"
        >
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
        <!-- Moon icon: shown when light, click to switch to dark -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="theme-icon moon-icon"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>

      <!-- User Avatar & Dropdown -->
      <div class="user-menu-wrap" ref="menuRef">
        <button class="topbar-avatar" @click="showDropdown = !showDropdown" title="Menu Pengguna">
          <img v-if="authStore.avatarUrl" :src="authStore.avatarUrl" alt="Avatar" class="avatar-header-img" />
          <span v-else>{{ authStore.userInitials }}</span>
        </button>

        <Transition name="fade">
          <div v-if="showDropdown" class="user-dropdown">
            <div class="user-dropdown-header">
              <span class="dropdown-name">{{ authStore.displayName }}</span>
              <span class="dropdown-email" :title="authStore.userEmail">{{ authStore.userEmail }}</span>
            </div>
            <div class="user-dropdown-divider"></div>
            <!-- Edit Profile Button -->
            <button class="dropdown-item" @click="handleOpenProfile">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Edit Profil</span>
            </button>
            <!-- Toggle Theme Dropdown Option -->
            <button class="dropdown-item" @click="handleToggleThemeDropdown">
              <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span>{{ isDark ? 'Mode Terang (Light)' : 'Mode Gelap (Dark)' }}</span>
            </button>
            <button class="dropdown-item logout" @click="handleLogout">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Keluar (Sign Out)</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import { useTaskStore } from '~/stores/taskStore'
import { useTheme } from '~/composables/useTheme'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const authStore = useAuthStore()
const taskStore = useTaskStore()
const { isDark, toggleTheme } = useTheme()

const showDropdown = ref<boolean>(false)
const menuRef = ref<HTMLDivElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const handleOpenProfile = () => {
  showDropdown.value = false
  authStore.openProfileModal()
}

const handleToggleThemeDropdown = () => {
  toggleTheme()
  showDropdown.value = false
}

const handleLogout = () => {
  showDropdown.value = false
  authStore.openLogoutModal()
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  if (menuRef.value && !menuRef.value.contains(target)) {
    showDropdown.value = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.topbar {
  height: 60px;
  background: #0f172a;
  border-bottom: 1px solid #1f2a3f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Left */
.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.toggle-btn {
  background: #111726;
  border: 1px solid #1f2a3f;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.toggle-btn:hover {
  background: #172136;
  border-color: #2e3e5e;
  color: #f1f5f9;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
}

.breadcrumb-root {
  color: #94a3b8;
  font-weight: 500;
}

.breadcrumb-sep {
  color: #64748b;
  flex-shrink: 0;
}

.breadcrumb-current {
  color: #f8fafc;
  font-weight: 600;
}

/* Right */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  background: #090d16;
  border: 1px solid #1f2a3f;
  border-radius: 8px;
  padding: 7px 42px 7px 32px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  width: 220px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
}

.search-input:focus {
  border-color: var(--border-focus, #005afb);
  box-shadow: 0 0 0 2px rgba(0, 90, 251, 0.2);
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-kbd {
  position: absolute;
  right: 8px;
  background: #111726;
  border: 1px solid #1f2a3f;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 4px;
  pointer-events: none;
  font-family: monospace;
}

/* User Menu */
.user-menu-wrap {
  position: relative;
}

.topbar-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #111726;
  color: #f1f5f9;
  border: 1.5px solid #2d3b55;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, transform 0.15s ease;
  overflow: hidden;
  padding: 0;
}

.avatar-header-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.topbar-avatar:hover {
  border-color: var(--accent-primary, #005afb);
  transform: scale(1.05);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 230px;
  background: #111726;
  border: 1px solid #1f2a3f;
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
  padding: 6px;
  z-index: 200;
}

.user-dropdown-header {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-name {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}

.dropdown-email {
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-dropdown-divider {
  height: 1px;
  background: #1f2a3f;
  margin: 4px 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  font-family: inherit;
}

.dropdown-item:hover {
  background: #172136;
  color: #ffffff;
}

.dropdown-item.logout {
  color: #fca5a5;
}

.dropdown-item.logout:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Theme Toggle Button */
.theme-toggle-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #111726;
  border: 1px solid #1f2a3f;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-toggle-btn:hover {
  background: #172136;
  border-color: #2e3e5e;
  color: #f1f5f9;
  transform: translateY(-1px);
}

.theme-toggle-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3);
}

.theme-icon {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-toggle-btn:hover .theme-icon {
  transform: rotate(15deg);
}

html.light .theme-toggle-btn {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

html.light .theme-toggle-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
  color: #0f172a;
}

@media (max-width: 640px) {
  .topbar {
    padding: 0 12px;
  }

  .breadcrumb-root,
  .breadcrumb-sep {
    display: none;
  }

  .search-kbd {
    display: none;
  }

  .search-input {
    width: 120px;
    font-size: 12px;
    padding-left: 28px;
    padding-right: 8px;
  }

  .search-input:focus {
    width: 160px;
  }
}

@media (max-width: 420px) {
  .search-box {
    display: none;
  }
}
</style>
