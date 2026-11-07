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
  background: rgba(3, 7, 18, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
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
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-title {
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 600;
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-counter {
  color: #818cf8;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
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
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  transform: translateY(-1px);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
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
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
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
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(8px);
}

.prev-btn {
  left: 12px;
}

.next-btn {
  right: 12px;
}

.nav-btn:hover {
  background: #005afb;
  border-color: #818cf8;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.5);
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
