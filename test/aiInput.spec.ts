import { describe, it, expect } from 'vitest'
import { limitAiText } from '../server/utils/aiInput'

describe('AI input limit', () => {
  it('memotong teks panjang dan membuang nilai bukan string', () => {
    expect(limitAiText(`  ${'a'.repeat(2100)}  `)).toHaveLength(2000)
    expect(limitAiText(null)).toBe('')
    expect(limitAiText('  halo  ')).toBe('halo')
  })
})
