-- ==============================================================================
-- MIGRATION: 05_soloflow_phase1_attributes.sql
-- DESKRIPSI: Skrip penambahan atribut alur kerja SoloFlow ke tabel public.todos
--            (Priority, Status, Due Date, Estimated Hours, Tags, Markdown)
-- ==============================================================================

-- 1. Buat Enum Types untuk Prioritas dan Status (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED');
  END IF;
END $$;

-- 2. Tambahkan kolom atribut baru ke tabel public.todos
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS priority task_priority NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS status task_status NOT NULL DEFAULT 'TODO',
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(4, 1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description_markdown TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT NULL;

-- 3. Indeks untuk optimasi filter & sortir cepat
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos (priority);
CREATE INDEX IF NOT EXISTS idx_todos_status ON public.todos (status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos (due_date);

-- 4. Fungsi Sinkronisasi Otomatis antara `status`, `is_completed`, serta alias `title` <-> `task`
CREATE OR REPLACE FUNCTION public.sync_todos_status_and_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Sinkronisasi nama tugas antara kolom `task` (bawaan) dan `title` (SoloFlow)
  IF NEW.task IS NOT NULL AND (NEW.title IS NULL OR NEW.title = '') THEN
    NEW.title := NEW.task;
  ELSIF NEW.title IS NOT NULL AND (NEW.task IS NULL OR NEW.task = '') THEN
    NEW.task := NEW.title;
  END IF;

  -- Sinkronisasi URL cover image
  IF NEW.image_url IS NOT NULL AND NEW.cover_image_url IS NULL THEN
    NEW.cover_image_url := NEW.image_url;
  ELSIF NEW.cover_image_url IS NOT NULL AND NEW.image_url IS NULL THEN
    NEW.image_url := NEW.cover_image_url;
  END IF;

  -- Jika status diubah menjadi 'DONE', set is_completed = true
  IF NEW.status = 'DONE' THEN
    NEW.is_completed := true;
  -- Jika is_completed diubah menjadi true secara langsung, pastikan status = 'DONE'
  ELSIF NEW.is_completed = true AND (OLD.is_completed IS DISTINCT FROM true OR NEW.status != 'DONE') THEN
    NEW.status := 'DONE';
  -- Jika status diubah ke non-DONE, set is_completed = false
  ELSIF NEW.status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'ARCHIVED') THEN
    NEW.is_completed := false;
  -- Jika is_completed diubah menjadi false saat status DONE, kembalikan ke 'TODO'
  ELSIF NEW.is_completed = false AND NEW.status = 'DONE' THEN
    NEW.status := 'TODO';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_todos_status ON public.todos;
CREATE TRIGGER tr_sync_todos_status
BEFORE INSERT OR UPDATE OF status, is_completed, task, title ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.sync_todos_status_and_completion();

-- 5. Sinkronisasi data lama yang sudah ada di database
UPDATE public.todos
SET title = task
WHERE title IS NULL AND task IS NOT NULL;

UPDATE public.todos
SET status = 'DONE'
WHERE is_completed = true AND status != 'DONE';

UPDATE public.todos
SET status = 'TODO'
WHERE is_completed = false AND (status IS NULL OR status = 'DONE');
