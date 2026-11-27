// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { useModalFocus } from '../app/composables/useModalFocus'

const mountDialog = async (open: Ref<boolean>) => {
  const host = document.createElement('div')
  const opener = document.createElement('button')
  document.body.append(host, opener)
  opener.focus()

  const App = defineComponent({
    setup() {
      const root = ref<HTMLElement | null>(null)
      useModalFocus(open, root, () => { open.value = false })
      return () => open.value
        ? h('div', { ref: root, role: 'dialog', 'aria-modal': 'true', tabindex: -1 }, [
          h('button', { class: 'first' }, 'Pertama'),
          h('button', { class: 'last' }, 'Terakhir')
        ])
        : null
    }
  })
  const app = createApp(App)
  app.mount(host)
  open.value = true
  await nextTick()
  await nextTick()

  return {
    dialog: () => host.querySelector<HTMLElement>('[role="dialog"]'),
    cleanup: () => { app.unmount(); host.remove(); opener.remove() },
    opener
  }
}

describe('useModalFocus', () => {
  it('fokus root, menjebak Tab, Escape menutup, lalu memulihkan fokus', async () => {
    const open = ref(false)
    const { dialog, cleanup, opener } = await mountDialog(open)

    expect(document.activeElement).toBe(dialog())
    const first = dialog()!.querySelector<HTMLButtonElement>('.first')!
    const last = dialog()!.querySelector<HTMLButtonElement>('.last')!

    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(first)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    await nextTick()
    expect(open.value).toBe(false)
    expect(document.activeElement).toBe(opener)

    cleanup()
  })
})
