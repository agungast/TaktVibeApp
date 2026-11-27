import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useModalFocus(isOpen: Ref<boolean>, root: Ref<HTMLElement | null>, close: () => void) {
  let previous: HTMLElement | null = null

  // Hanya dialog teratas yang boleh menangani Escape/Tab saat dialog bertumpuk.
  const isTop = () => {
    const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
    return dialogs[dialogs.length - 1] === root.value
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (!isOpen.value || !isTop()) return
    const target = event.target as HTMLElement | null
    const nested = target?.closest?.('[role="dialog"]')
    if (nested && nested !== root.value && root.value?.contains(nested)) return

    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== 'Tab' || !root.value) return

    const items = Array.from(root.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!items.length) {
      event.preventDefault()
      root.value.focus()
      return
    }
    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && (document.activeElement === first || document.activeElement === root.value)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(isOpen, (open, wasOpen) => {
    if (open && !wasOpen) {
      previous = document.activeElement as HTMLElement | null
      nextTick(() => root.value?.focus())
    } else if (!open && wasOpen) {
      if (previous && document.contains(previous)) previous.focus()
      previous = null
    }
  })

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
