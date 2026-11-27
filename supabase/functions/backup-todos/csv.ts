export interface BackupTodoRow {
  id?: string | number | null
  user_id?: string | null
  task?: unknown
  is_completed?: boolean | null
  image_url?: unknown
  created_at?: unknown
  completed_at?: unknown
}

const HEADER = 'id,task,status,image_url,created_at,completed_at\n'

/** Awali sel dengan `'` bila bisa dibaca Excel sebagai rumus. */
export function csvCell(value: unknown): string {
  const raw = String(value ?? '')
  const guarded = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return `"${guarded.replace(/"/g, '""')}"`
}

function formatDate(value: unknown): string {
  if (!value) return ''
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('id-ID')
}

export function buildTodoCsv(todos: BackupTodoRow[]): string {
  const rows = todos.map((todo) => [
    todo.id,
    todo.task,
    todo.is_completed ? 'Selesai' : 'Aktif',
    todo.image_url,
    formatDate(todo.created_at),
    formatDate(todo.completed_at)
  ].map(csvCell).join(','))

  return HEADER + rows.join('\n')
}
