const WINDOW_MS = 60 * 60 * 1000
const LIMIT_PER_WINDOW = 30
const PRUNE_AT = 1000

interface QuotaWindow {
  count: number
  resetAt: number
}

const windows = new Map<string, QuotaWindow>()

/** Kuota per user untuk /api/ai/** — bukan rate limiter global (lihat nuxt.config.ts). */
export function consumeAiQuota(userId: string, now = Date.now()): boolean {
  const current = windows.get(userId)

  if (!current || now >= current.resetAt) {
    if (windows.size >= PRUNE_AT) {
      for (const [id, window] of windows) {
        if (now >= window.resetAt) windows.delete(id)
      }
    }
    windows.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (current.count >= LIMIT_PER_WINDOW) return false
  current.count += 1
  return true
}
