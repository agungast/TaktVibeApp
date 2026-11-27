import { describe, it, expect } from 'vitest'
import { listPrivatePaths } from '../supabase/functions/migrate-private-attachments/paths'

describe('legacy private storage migration', () => {
  it('menelusuri folder dan halaman', async () => {
    const pages: Record<string, Array<{ name: string; id: string | null }>> = {
      'private|0': [{ name: 'u1', id: null }],
      'private|1': [{ name: 'root.txt', id: 'f0' }],
      'private/u1|0': [{ name: 'a.pdf', id: 'f1' }]
    }
    const list = async (path: string, options: { offset: number }) => ({
      data: pages[`${path}|${options.offset}`] ?? [],
      error: null
    })

    const paths = await listPrivatePaths(list, 'private', 1)
    expect(paths).toEqual(['private/u1/a.pdf', 'private/root.txt'])
  })
})
