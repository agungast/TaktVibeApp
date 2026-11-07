import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastItem, ToastType } from '~/types/toast'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([])
  const timerMap = new Map<string, ReturnType<typeof setTimeout>>()

  function removeToast(id: string): void {
    const timer = timerMap.get(id)
    if (timer) {
      clearTimeout(timer)
      timerMap.delete(id)
    }
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function addToast(payload: {
    message: string
    type?: ToastType
    title?: string
    duration?: number
  }): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const duration = payload.duration ?? 3500
    const type = payload.type || 'info'

    // Batasi tumpukan maksimal 5 toast agar tidak memenuhi layar
    if (toasts.value.length >= 5) {
      const oldest = toasts.value[0]
      if (oldest) {
        removeToast(oldest.id)
      }
    }

    const item: ToastItem = {
      id,
      message: payload.message,
      type,
      title: payload.title,
      duration
    }

    toasts.value.push(item)

    if (duration > 0 && import.meta.client) {
      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      timerMap.set(id, timer)
    }

    return id
  }

  function success(message: string, title?: string, duration?: number): string {
    return addToast({ message, type: 'success', title, duration })
  }

  function error(message: string, title?: string, duration?: number): string {
    return addToast({ message, type: 'error', title: title || 'Terjadi Kesalahan', duration: duration || 4500 })
  }

  function warning(message: string, title?: string, duration?: number): string {
    return addToast({ message, type: 'warning', title, duration })
  }

  function info(message: string, title?: string, duration?: number): string {
    return addToast({ message, type: 'info', title, duration })
  }

  function clearAll(): void {
    timerMap.forEach(timer => clearTimeout(timer))
    timerMap.clear()
    toasts.value = []
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  }
})
