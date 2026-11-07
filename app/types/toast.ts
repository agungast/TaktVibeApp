export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  title?: string
  duration?: number // Milliseconds (default: 3500)
}
