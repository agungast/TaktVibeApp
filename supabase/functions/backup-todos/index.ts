import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // ─── Auth check ──────────────────────────────────────────────────
  // Hanya izinkan request yang membawa header Authorization
  // dengan nilai "Bearer <SERVICE_ROLE_KEY>". Ini mencegah
  // pemanggilan anon/anonim ke endpoint backup.
  const authHeader = req.headers.get('Authorization')
  const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    expectedKey!
  )

  // 1. Ambil semua data todos
  const { data: todos, error } = await supabase
    .from('todos')
    .select('id, task, is_completed, image_url, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 2. Konversi ke format CSV
  const header = 'id,task,status,image_url,created_at,updated_at\n'
  const rows = (todos ?? []).map(t => {
    const task   = `"${String(t.task ?? '').replace(/"/g, '""')}"`
    const status = t.is_completed ? 'Selesai' : 'Aktif'
    const img    = t.image_url ? `"${t.image_url}"` : ''
    const created = t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : ''
    const updated = t.updated_at ? new Date(t.updated_at).toLocaleString('id-ID') : ''
    return `${t.id},${task},${status},${img},${created},${updated}`
  }).join('\n')

  const csvContent = header + rows
  const csvBytes   = new TextEncoder().encode(csvContent)

  // 3. Buat nama file dengan tanggal hari ini (WIB = UTC+7)
  const now      = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const dateStr  = now.toISOString().slice(0, 10)
  const fileName = `todos_${dateStr}.csv`

  // 4. Upload ke Supabase Storage bucket "backups"
  const { error: uploadError } = await supabase.storage
    .from('backups')
    .upload(fileName, csvBytes, {
      contentType: 'text/csv',
      upsert: true
    })

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  console.log(`[backup-todos] Berhasil: ${fileName} (${todos?.length ?? 0} baris)`)

  return new Response(
    JSON.stringify({ success: true, file: fileName, total: todos?.length ?? 0 }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
