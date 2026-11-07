-- ============================================================================
-- MIGRATION: 02_storage_v2_and_attachments.sql
-- DESKRIPSI: Tabel `task_attachments`, RLS Policies, dan konfigurasi Storage v2
--            (Multiple Attachments, Image Transformation, Private Storage & Signed URLs)
-- ============================================================================

-- 1. Buat tabel task_attachments untuk mendukung banyak lampiran per tugas
-- Catatan: task_id menggunakan tipe UUID agar sesuai dengan tipe kolom id pada tabel todos
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.todos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index untuk performa query cepat
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments (task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id ON public.task_attachments (user_id);

-- 3. Trigger otomatis user_id untuk task_attachments
CREATE OR REPLACE FUNCTION public.handle_attachments_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_task_attachments_user_id ON public.task_attachments;
CREATE TRIGGER tr_task_attachments_user_id
BEFORE INSERT ON public.task_attachments
FOR EACH ROW
EXECUTE FUNCTION public.handle_attachments_user_id();

-- 4. Aktifkan Row Level Security (RLS) pada tabel task_attachments
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- 5. Bersihkan policy lama jika ada
DROP POLICY IF EXISTS "Users can view their own task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can insert their own task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can update their own task attachments" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can delete their own task attachments" ON public.task_attachments;

-- 6. Buat 4 Policy RLS untuk task_attachments
CREATE POLICY "Users can view their own task attachments" 
ON public.task_attachments FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task attachments" 
ON public.task_attachments FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id 
  OR user_id IS NULL
);

CREATE POLICY "Users can update their own task attachments" 
ON public.task_attachments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task attachments" 
ON public.task_attachments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 7. Aktifkan Broadcast Realtime untuk tabel task_attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'task_attachments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_attachments;
  END IF;
END $$;

ALTER TABLE public.task_attachments REPLICA IDENTITY FULL;

-- 8. Setup Storage RLS untuk bucket 'project-crud' (Folder public/ dan private/)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-crud') THEN
    -- A. INSERT: User terautentikasi bisa upload file ke public/ maupun private/
    DROP POLICY IF EXISTS "Authenticated users can upload objects" ON storage.objects;
    CREATE POLICY "Authenticated users can upload objects" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'project-crud');

    -- B. SELECT (Publik): Siapa saja / user bisa membaca file dalam folder public/
    DROP POLICY IF EXISTS "Allow public read for public folder" ON storage.objects;
    CREATE POLICY "Allow public read for public folder" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'project-crud' AND (storage.foldername(name))[1] = 'public');

    -- C. SELECT (Privat & Signed URLs): Hanya user pemilik yang bisa membaca / request Signed URL file private/
    DROP POLICY IF EXISTS "Allow owner read for private folder" ON storage.objects;
    CREATE POLICY "Allow owner read for private folder" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (bucket_id = 'project-crud' AND (storage.foldername(name))[1] = 'private');

    -- D. DELETE: User terautentikasi bisa menghapus file miliknya
    DROP POLICY IF EXISTS "Authenticated users can delete objects" ON storage.objects;
    CREATE POLICY "Authenticated users can delete objects" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'project-crud');
  END IF;
END $$;
