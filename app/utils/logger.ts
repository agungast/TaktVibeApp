/**
 * Logger yang hanya aktif di development.
 * Di production, console.error/warn di-suppress agar tidak bocor
 * ke console browser end-user.
 */

const isDev = import.meta.env?.DEV ?? true

export function logError(...args: unknown[]): void {
  if (isDev) console.error(...args)
}

export function logWarn(...args: unknown[]): void {
  if (isDev) console.warn(...args)
}