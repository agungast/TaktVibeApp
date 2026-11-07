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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

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