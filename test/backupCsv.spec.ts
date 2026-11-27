import { describe, it, expect } from 'vitest'
import { buildTodoCsv, csvCell } from '../supabase/functions/backup-todos/csv'

describe('backup CSV', () => {
  it('mengamankan sel yang diawali rumus', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe(`"'=SUM(A1:A2)"`)
    expect(csvCell('@cmd')).toBe(`"'@cmd"`)
    expect(csvCell('Judul "penting"')).toBe('"Judul ""penting"""')
  })

  it('menulis header dan satu baris tugas', () => {
    const csv = buildTodoCsv([{ id: 't1', task: '+selesai', is_completed: true }])
    expect(csv).toContain('id,task,status,image_url,created_at,completed_at')
    expect(csv).toContain(`"'+selesai"`)
    expect(csv).toContain('"Selesai"')
  })
})
