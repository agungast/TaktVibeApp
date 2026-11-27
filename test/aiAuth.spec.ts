import { describe, it, expect } from 'vitest'
import { requireAiUser } from '../server/utils/aiAuth'

describe('AI auth guard', () => {
  it('mengubah error token menjadi 401', async () => {
    await expect(
      requireAiUser(async () => { throw new Error('JWT expired') })
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('menerima user dengan id', async () => {
    const user = await requireAiUser(async () => ({ id: 'user-1' }))
    expect(user.id).toBe('user-1')
  })
})
