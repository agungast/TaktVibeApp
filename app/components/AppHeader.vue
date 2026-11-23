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
          <img
            v-if="authStore.avatarUrl && !avatarErrored"
            :key="authStore.avatarUrl"
            :src="authStore.avatarUrl"
            alt="Avatar"
            class="avatar-header-img"
            @error="onAvatarError"
            referrerpolicy="no-referrer"
            crossorigin="anonymous"
          />
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
            <!-- Install PWA -->
            <button v-if="canInstall && !isInstalled" class="dropdown-item" @click="handleInstallApp">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Install Aplikasi</span>
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
import { usePwaInstall } from '~/composables/usePwaInstall'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const authStore = useAuthStore()
const taskStore = useTaskStore()
const { isDark, toggleTheme } = useTheme()
const { canInstall, isInstalled, install, init } = usePwaInstall()
onMounted(() => init())
async function handleInstallApp() { await install(); showDropdown.value = false }

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

const avatarErrored = ref(false)

const onAvatarError = (e: Event) => {
  avatarErrored.value = true
  const target = e.target as HTMLImageElement
  if (target) target.style.display = 'none'
}

watch(() => authStore.avatarUrl, (newUrl, oldUrl) => {
  // Reset error state HANYA jika URL benar-benar berganti ke URL baru yang berbeda
  // Jangan reset jika URL sama (mencegah broken image loop setelah session refresh)
  if (newUrl && newUrl !== oldUrl) {
    avatarErrored.value = false
  }
})

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
  height: 56px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.toggle-btn, .theme-toggle-btn, .topbar-avatar {
  width: 36px; height: 36px; border-radius: var(--radius-control);
  background: transparent; border: 1px solid var(--border-color);
  color: var(--text-secondary); cursor: pointer; display: inline-flex;
  align-items: center; justify-content: center; padding: 0; font-family: inherit;
  transition: background-color 150ms ease, color 150ms ease;
}
.toggle-btn:hover, .theme-toggle-btn:hover, .topbar-avatar:hover { background: var(--bg-hover); color: var(--text-primary); }
.toggle-btn:focus-visible, .theme-toggle-btn:focus-visible, .topbar-avatar:focus-visible, .search-input:focus-visible, .dropdown-item:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(29,95,191,0.18); }
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; min-width: 0; }
.breadcrumb-root { color: var(--text-muted); }
.breadcrumb-sep { color: var(--text-muted); flex-shrink: 0; }
.breadcrumb-current { color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.search-box { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 11px; color: var(--text-muted); pointer-events: none; }
.search-input {
  width: 240px; height: 36px; padding: 0 44px 0 34px;
  border-radius: var(--radius-control); border: 1px solid var(--input-border);
  background: var(--bg-surface); color: var(--text-primary); font-size: 13px; font-family: inherit;
}
.search-input::placeholder { color: var(--text-muted); }
.search-kbd {
  position: absolute; right: 8px; padding: 2px 5px; border: 1px solid var(--border-color);
  border-radius: 4px; font-size: 11px; color: var(--text-muted); background: var(--bg-subtle);
}
.user-menu-wrap { position: relative; }
.topbar-avatar { border-radius: 50%; font-size: 12px; font-weight: 600; overflow: hidden; }
.avatar-header-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0; width: 240px;
  background: var(--dropdown-bg); border: 1px solid var(--border-color);
  border-radius: var(--radius-card); box-shadow: var(--shadow-md); padding: 6px; z-index: 200;
}
.user-dropdown-header { padding: 10px; display: flex; flex-direction: column; gap: 2px; }
.dropdown-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.dropdown-email { font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-dropdown-divider { height: 1px; background: var(--border-color); margin: 4px 0; }
.dropdown-item {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  background: transparent; border: 0; border-radius: var(--radius-control);
  color: var(--text-soft); font-size: 13px; cursor: pointer; font-family: inherit;
  transition: background-color 150ms ease, color 150ms ease;
}
.dropdown-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.dropdown-item.logout { color: var(--color-danger); }
.dropdown-item.logout:hover { background: rgba(196,36,42,0.08); color: var(--color-danger); }
.fade-enter-active,.fade-leave-active { transition: opacity 150ms ease, transform 150ms cubic-bezier(0.16,1,0.3,1); }
.fade-enter-from,.fade-leave-to { opacity: 0; transform: translateY(-4px); }
@media (max-width: 768px) {
  .topbar { padding: 0 16px; }
  .search-input { width: 160px; }
  .search-kbd { display: none; }
}
@media (max-width: 560px) {
  .breadcrumb-root, .breadcrumb-sep { display: none; }
  .search-input { width: 120px; padding-right: 10px; }
}
</style>
