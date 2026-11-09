import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task } from '~/types/task'
import { useTaskStore } from '~/stores/taskStore'
import { useToastStore } from '~/stores/toastStore'

export type FocusMode = 'work' | 'short_break' | 'long_break'

// Define the shape of taskStore to satisfy TypeScript
interface TaskStoreType {
  tasks: Task[]
  logFocusTime?: (taskId: string | number, minutes: number) => Promise<void>
  [key: string]: any
}

export const useFocusStore = defineStore('focus', () => {
  const taskStore = useTaskStore() as TaskStoreType
  const toast = useToastStore()

  // ─── Durasi (dalam Menit) ──────────────────────────────────────────────────
  const WORK_MINUTES = 25
  const SHORT_BREAK_MINUTES = 5
  const LONG_BREAK_MINUTES = 15

  // ─── State ─────────────────────────────────────────────────────────────────
  const activeTask = ref<Task | null>(null)
  const timerMode = ref<FocusMode>('work')
  const timeLeft = ref<number>(WORK_MINUTES * 60)
  const isRunning = ref<boolean>(false)
  const isOpen = ref<boolean>(false)
  const isMinimized = ref<boolean>(false)
  const sessionsCompleted = ref<number>(0)

  // Tracking timestamp target untuk mencegah drift saat browser tab di-background/throttle
  let targetTimestamp: number | null = null
  let timerInterval: ReturnType<typeof setInterval> | null = null

  // ─── Computed ──────────────────────────────────────────────────────────────
  const formattedTime = computed<string>(() => {
    const minutes = Math.floor(timeLeft.value / 60)
    const seconds = timeLeft.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const currentDurationTotal = computed<number>(() => {
    if (timerMode.value === 'work') return WORK_MINUTES * 60
    if (timerMode.value === 'short_break') return SHORT_BREAK_MINUTES * 60
    return LONG_BREAK_MINUTES * 60
  })

  const progressPercent = computed<number>(() => {
    const total = currentDurationTotal.value
    if (total <= 0) return 0
    const elapsed = total - timeLeft.value
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
  })

  // ─── Audio Chime (Web Audio API Synthesizer) ───────────────────────────────
  function playNotificationChime(): void {
    if (!import.meta.client) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.8)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // ─── Timer Core Functions ──────────────────────────────────────────────────
  function tick(): void {
    if (targetTimestamp !== null) {
      const remaining = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000))
      timeLeft.value = remaining

      if (import.meta.client) {
        document.title = `(${formattedTime.value}) ${activeTask.value?.title || 'Fokus'} - TaktVibe`
      }

      if (remaining <= 0) {
        handleTimerComplete()
      }
    } else if (timeLeft.value > 0) {
      timeLeft.value--
      if (import.meta.client) {
        document.title = `(${formattedTime.value}) ${activeTask.value?.title || 'Fokus'} - TaktVibe`
      }
      if (timeLeft.value <= 0) {
        handleTimerComplete()
      }
    } else {
      handleTimerComplete()
    }
  }

  function handleTimerComplete(): void {
    pauseTimer()
    playNotificationChime()

    if (timerMode.value === 'work') {
      sessionsCompleted.value++

      // Catat waktu kerja aktual ke Supabase via taskStore & update reactive state
      if (activeTask.value) {
        const addedHours = Math.round((WORK_MINUTES / 60) * 10) / 10
        activeTask.value.actual_hours = Math.round(((Number(activeTask.value.actual_hours) || 0) + addedHours) * 10) / 10

        if (typeof (taskStore as any).logFocusTime === 'function') {
          void (taskStore as any).logFocusTime(activeTask.value.id, WORK_MINUTES)
        }
      }

      toast.success(
        `Sesi Pomodoro #${sessionsCompleted.value} tuntas! Waktu istirahat sejenak.`,
        'Sesi Fokus Selesai'
      )

      // Setiap 4 sesi kerja, sarankan istirahat panjang
      if (sessionsCompleted.value % 4 === 0) {
        setMode('long_break')
      } else {
        setMode('short_break')
      }
    } else {
      toast.info('Waktu istirahat selesai! Siap untuk sesi fokus berikutnya.', 'Istirahat Selesai')
      setMode('work')
    }
  }

  function startTimer(): void {
    if (isRunning.value) return
    isRunning.value = true
    targetTimestamp = Date.now() + timeLeft.value * 1000

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    timerInterval = setInterval(tick, 1000)
  }

  function pauseTimer(): void {
    isRunning.value = false
    targetTimestamp = null
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (import.meta.client) {
      document.title = 'TaktVibe - Personal Task & Knowledge Management'
    }
  }

  function toggleTimer(): void {
    if (isRunning.value) {
      pauseTimer()
    } else {
      startTimer()
    }
  }

  function resetTimer(): void {
    pauseTimer()
    if (timerMode.value === 'work') {
      timeLeft.value = WORK_MINUTES * 60
    } else if (timerMode.value === 'short_break') {
      timeLeft.value = SHORT_BREAK_MINUTES * 60
    } else {
      timeLeft.value = LONG_BREAK_MINUTES * 60
    }
  }

  function setMode(mode: FocusMode): void {
    pauseTimer()
    timerMode.value = mode
    resetTimer()
  }

  // ─── Public Actions ────────────────────────────────────────────────────────
  function startFocus(task: Task): void {
    // Cari referensi task terbaru dari taskStore jika tersedia
    const freshTask = (taskStore.tasks as Task[])?.find((t: Task) => String(t.id) === String(task.id)) || task
    activeTask.value = freshTask
    isOpen.value = true
    isMinimized.value = false
    setMode('work')
    startTimer()
    toast.info(`Mulai fokus pada: "${task.title}" (${WORK_MINUTES} Menit)`)
  }

  function openFocusWidget(): void {
    isOpen.value = true
    isMinimized.value = false
  }

  function minimizeWidget(): void {
    isMinimized.value = true
  }

  function expandWidget(): void {
    isMinimized.value = false
  }

  function closeFocusWidget(): void {
    pauseTimer()
    isOpen.value = false
    isMinimized.value = false
  }

  return {
    activeTask,
    timerMode,
    timeLeft,
    isRunning,
    isOpen,
    isMinimized,
    sessionsCompleted,
    formattedTime,
    progressPercent,
    WORK_MINUTES,
    SHORT_BREAK_MINUTES,
    LONG_BREAK_MINUTES,

    startFocus,
    openFocusWidget,
    minimizeWidget,
    expandWidget,
    closeFocusWidget,
    toggleTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode
  }
})
