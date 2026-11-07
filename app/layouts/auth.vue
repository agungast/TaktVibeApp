<template>
  <div class="auth-layout">
    <!-- Top-Right Theme Toggle -->
    <div class="auth-theme-toggle-wrap">
      <button
        type="button"
        class="theme-toggle-btn"
        @click="toggleTheme"
        :title="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
        :aria-label="isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'"
      >
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
    </div>

    <div class="auth-container">
      <!-- App Header / Logo -->
      <div class="auth-header">
        <NuxtLink to="/" class="auth-brand" title="TaktVibe">
          <img src="/images/logo-full-dark.png" alt="TaktVibe" class="auth-logo-img dark-only" />
          <img src="/images/logo-full-light.png" alt="TaktVibe" class="auth-logo-img light-only" />
        </NuxtLink>
        <p class="auth-brand-subtitle">Personal Task & Knowledge Management</p>
      </div>

      <!-- Page Content (Login / Register Card) -->
      <main class="auth-content">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="auth-footer">
        <p>&copy; 2026 TaktVibe. Protected with Supabase Row Level Security.</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  position: relative;
  font-family: 'Outfit', sans-serif;
  transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-theme-toggle-wrap {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.theme-toggle-btn {
  width: 36px;
  height: 36px;
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
  background: #ffffff;
  border-color: #cbd5e1;
  color: #475569;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

html.light .theme-toggle-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Container */
.auth-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.auth-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.auth-brand:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.auth-logo-img {
  height: 42px;
  width: auto;
  max-width: 220px;
  object-fit: contain;
  display: block;
}

.auth-brand-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.auth-content {
  width: 100%;
}

.auth-footer {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.auth-footer p {
  margin: 0;
}
</style>
