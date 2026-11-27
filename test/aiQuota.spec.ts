import { describe, it, expect } from 'vitest'
import { consumeAiQuota } from '../server/utils/aiQuota'

describe('AI quota per user', () => {
  it('membatasi 30 request per jam lalu reset', () => {
    const id = `quota-test-${Date.now()}`
    const now = 1_000_000

    for (let i = 0; i < 30; i++) {
      expect(consumeAiQuota(id, now)).toBe(true)
    }
    expect(consumeAiQuota(id, now)).toBe(false)
    expect(consumeAiQuota(id, now + 60 * 60 * 1000)).toBe(true)
  })
})
