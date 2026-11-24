<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="lightbox-overlay"
        @click="emit('close')"
        role="dialog"
        aria-modal="true"
        aria-label="Lightbox gambar penuh"
      >
        <!-- Top Toolbar -->
        <div class="lightbox-toolbar" @click.stop>
          <div class="toolbar-info">
            <span v-if="currentItem?.title" class="toolbar-title">{{ currentItem.title }}</span>
            <span v-if="totalItems > 1" class="toolbar-counter">
              {{ currentIndex + 1 }} / {{ totalItems }}
            </span>
          </div>
          <div class="toolbar-actions">
            <!-- Download Button -->
            <a
              v-if="currentUrl"
              :href="currentUrl"
              target="_blank"
              download
              class="toolbar-btn"
              title="Buka / Unduh Resolusi Penuh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </a>
            <!-- Close Button -->
            <button class="toolbar-btn close-btn" @click="emit('close')" title="Tutup (Esc)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Main Image Area with Prev/Next Navigation -->
        <div class="lightbox-stage" @click.stop>
          <!-- Prev Button -->
          <button
            v-if="totalItems > 1"
            class="nav-btn prev-btn"
            @click="emit('prev')"
            title="Gambar Sebelumnya (←)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <!-- Main Image -->
          <div class="lightbox-img-wrapper">
            <img
              v-if="currentUrl"
              :src="currentUrl"
              :alt="currentItem?.title || 'Tampilan gambar penuh'"
              class="lightbox-img"
            />
          </div>

          <!-- Next Button -->
          <button
            v-if="totalItems > 1"
            class="nav-btn next-btn"
            @click="emit('next')"
            title="Gambar Berikutnya (→)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { LightboxMediaItem } from '~/types/task'

const props = defineProps<{
  imageUrl?: string | null
  items?: LightboxMediaItem[]
  currentIndex?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'next'): void
  (e: 'prev'): void
}>()

const isOpen = computed<boolean>(() => {
  return !!props.imageUrl || (!!props.items && props.items.length > 0)
})

const totalItems = computed<number>(() => {
  if (props.items && props.items.length > 0) return props.items.length
  return props.imageUrl ? 1 : 0
})

const currentIndex = computed<number>(() => {
  return props.currentIndex ?? 0
})

const currentItem = computed<LightboxMediaItem | null>(() => {
  if (props.items && props.items.length > 0) {
    return props.items[currentIndex.value] ?? null
  }
  if (props.imageUrl) {
    return { url: props.imageUrl }
  }
  return null
})

const currentUrl = computed<string | null>(() => {
  return currentItem.value?.url ?? props.imageUrl ?? null
})

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowRight') {
    emit('next')
  } else if (e.key === 'ArrowLeft') {
    emit('prev')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(17, 19, 22, 0.94);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
  padding: 16px 24px;
}

/* Toolbar */
.lightbox-toolbar {
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(36, 39, 46, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-card);
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-counter {
  color: #f2f4f7;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 2px 8px;
  border-radius: var(--radius-card);
  font-size: 12px;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f2f4f7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
  text-decoration: none;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}
.toolbar-btn:focus-visible,
.nav-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(29, 95, 191, 0.35);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: var(--color-danger);
}

/* Stage */
.lightbox-stage {
  position: relative;
  width: 100%;
  max-width: 1200px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
}

.lightbox-img-wrapper {
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: var(--radius-card);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* Nav Buttons */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(36, 39, 46, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
  z-index: 10;
}

.prev-btn {
  left: 12px;
}

.next-btn {
  right: 12px;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.28);
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
