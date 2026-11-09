<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <ToastContainer />
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { setActivePinia } from 'pinia'
import { useTheme } from '~/composables/useTheme'

const route = useRoute()

useHead({
  title: () => (route.meta.title as string) || undefined,
  titleTemplate: (title) => {
    return title && title !== 'TaktVibe' ? `TaktVibe - ${title}` : 'TaktVibe'
  }
})

const { $pinia } = useNuxtApp()
if ($pinia) {
  setActivePinia($pinia)
}

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<style>
/* Font Outfit dimuat lewat <link> di nuxt.config.ts agar non-blocking
   dan konsisten dengan Content-Security-Policy. */

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  min-height: 100vh;
}
</style>