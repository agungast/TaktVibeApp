import { describe, it, expect } from 'vitest'
import { parseFallbackDurationHours } from '../server/utils/quickParseFallback'

describe('quick-parse fallback duration', () => {
  it('mengubah menit ke jam', () => {
    expect(parseFallbackDurationHours('Meeting 30 menit')).toBe(0.5)
  })

  it('menerima desimal dengan koma', () => {
    expect(parseFallbackDurationHours('estimasi 1,5 jam')).toBe(1.5)
  })
})
