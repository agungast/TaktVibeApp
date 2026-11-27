import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildTodoCsv, type BackupTodoRow } from './csv.ts'

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
})

serve(async (req) => {
  // ─── Auth check ──────────────────────────────────────────────────
  // Hanya izinkan request yang membawa header Authorization
  // dengan nilai "Bearer <SERVICE_ROLE_KEY>". Ini mencegah
  // pemanggilan anon/anonim ke endpoint backup.
  const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!expectedKey) {
    return json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${expectedKey}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    expectedKey
  )

  try {
    const { data: todos, error } = await supabase
      .from('todos')
      .select('id, user_id, task, is_completed, image_url, created_at, completed_at')
      .order('created_at', { ascending: false })

    if (error) return json({ error: error.message }, 500)

    // 2. Kelompokkan backup per user agar tidak saling menimpa.
    const groups = new Map<string, BackupTodoRow[]>()
    for (const todo of (todos ?? []) as BackupTodoRow[]) {
      const owner = todo.user_id ?? 'unknown'
      const rows = groups.get(String(owner)) ?? []
      rows.push(todo)
      groups.set(String(owner), rows)
    }

    // WIB = UTC+7
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const dateStr = now.toISOString().slice(0, 10)
    const files: string[] = []

    for (const [owner, rows] of groups) {
      const fileName = `${owner}/todos_${dateStr}.csv`
      const csvBytes = new TextEncoder().encode(buildTodoCsv(rows))

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(fileName, csvBytes, {
          contentType: 'text/csv',
          upsert: true
        })

      if (uploadError) return json({ error: uploadError.message }, 500)
      files.push(fileName)
    }

    console.log(`[backup-todos] Berhasil: ${files.length} file (${todos?.length ?? 0} baris)`)

    return json({ success: true, files, total: todos?.length ?? 0 }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Gagal membuat backup' }, 500)
  }
})
