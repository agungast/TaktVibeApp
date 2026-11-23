-- ============================================================================
-- MIGRATION: 14_create_backups_bucket.sql
-- DESKRIPSI: Membuat bucket "backups" untuk hasil export CSV (backup-todos).
--            Bucket ini TIDAK publik (public = false) dan dilindungi RLS
--            owner-scoped. Akses hanya melalui service role key (edge function
--            backup-todos) yang sudah memverifikasi Authorization header.
-- ============================================================================

-- 1. Buat bucket backups (tidak publik)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 26214400, ARRAY['text/csv'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Policy: hanya pemilik yang bisa baca file miliknya
DROP POLICY IF EXISTS "takt_backups_select_own" ON storage.objects;
CREATE POLICY "takt_backups_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backups'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy: hanya pemilik yang bisa upload ke folder miliknya
DROP POLICY IF EXISTS "takt_backups_insert_own" ON storage.objects;
CREATE POLICY "takt_backups_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: hanya pemilik yang bisa delete file miliknya
DROP POLICY IF EXISTS "takt_backups_delete_own" ON storage.objects;
CREATE POLICY "takt_backups_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Catatan: Edge function backup-todos menggunakan SERVICE_ROLE_KEY yang
--          melewati RLS. Policy di atas sebagai cadangan jika bucket diakses
--          dari client (mis. build Signed URL) — tetap dibatasi owner-scoped.
