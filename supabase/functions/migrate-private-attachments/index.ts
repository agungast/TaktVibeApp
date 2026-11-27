import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { listPrivatePaths } from './paths.ts'

const OLD_BUCKET = 'project-crud'
const NEW_BUCKET = 'project-crud-private'
const PREFIX = 'private/'

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
})

serve(async (req) => {
  // Service role saja: object privat tidak boleh dipindah oleh user biasa.
  const expectedKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!expectedKey) {
    return json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi' }, 500)
  }
  if (req.headers.get('Authorization') !== `Bearer ${expectedKey}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, expectedKey)

  try {
    const list = (path: string, options: { limit: number; offset: number }) =>
      supabase.storage.from(OLD_BUCKET).list(path, options)

    const paths = await listPrivatePaths(list)
    let moved = 0

    for (const path of paths) {
      const { data: file, error: downloadError } = await supabase.storage
        .from(OLD_BUCKET)
        .download(path.slice(PREFIX.length))

      if (downloadError || !file) {
        throw new Error(downloadError?.message ?? `Gagal mengunduh ${path}`)
      }

      // path sudah diawali `private/` sehingga prefix menentukan bucket tujuan.
      const { error: uploadError } = await supabase.storage
        .from(NEW_BUCKET)
        .upload(path, await file.arrayBuffer(), {
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw new Error(uploadError.message)

      // Hapus sumber hanya setelah salinan tujuan aman.
      const { error: removeError } = await supabase.storage
        .from(OLD_BUCKET)
        .remove([path.slice(PREFIX.length)])

      if (removeError) throw new Error(removeError.message)
      moved++
    }

    return json({ success: true, moved }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Gagal memindahkan object' }, 500)
  }
})
