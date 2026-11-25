/** Konversi estimasi durasi bahasa alami ke jam untuk fallback quick-parse. */
export function parseFallbackDurationHours(prompt: string): number {
  const match = prompt.match(/(\d+(?:[.,]\d+)?)\s*(jam|hour|hrs?|hr|menit|minute|detik)/i)
  if (!match) return 0

  const value = parseFloat(match[1]!.replace(',', '.'))
  const unit = match[2]!.toLowerCase()
  const hours = /^(menit|minute)$/.test(unit)
    ? value / 60
    : unit === 'detik'
      ? value / 3600
      : value

  return Math.max(0.5, hours)
}
