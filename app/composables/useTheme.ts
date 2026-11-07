export type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'taktvibe_theme'
const LEGACY_STORAGE_KEY = 'taskflow_theme'

export const useTheme = () => {
  const theme = useState<ThemeMode>('taktvibe_theme_state', () => 'dark')

  const isDark = computed(() => theme.value === 'dark')

  const applyThemeToDom = (mode: ThemeMode) => {
    if (!import.meta.client) return
    const root = document.documentElement
    if (mode === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    }
  }

  const setTheme = (mode: ThemeMode) => {
    theme.value = mode
    if (import.meta.client) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode)
      } catch (e) {
        // Handle private browsing or localStorage disabled
      }
      applyThemeToDom(mode)
    }
  }

  const toggleTheme = () => {
    const nextMode: ThemeMode = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(nextMode)
  }

  const initTheme = () => {
    if (!import.meta.client) return
    try {
      const saved = (localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)) as ThemeMode | null
      if (saved === 'light' || saved === 'dark') {
        theme.value = saved
      } else {
        // Detect system preference if no manual choice saved
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
        theme.value = prefersLight ? 'light' : 'dark'
      }
    } catch (e) {
      theme.value = 'dark'
    }
    applyThemeToDom(theme.value)
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme
  }
}
