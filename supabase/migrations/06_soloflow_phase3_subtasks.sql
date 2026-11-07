-- ==============================================================================
-- MIGRATION: 06_soloflow_phase3_subtasks.sql
-- DESKRIPSI: Tabel `subtasks` (Checklist), RLS Policies, dan Relasi ke `todos`
--            SoloFlow Fase 3: Rich Detail Workspace & Subtask Checklist
-- ==============================================================================

-- 1. Buat tabel subtasks (mendeteksi tipe kolom id pada public.todos secara otomatis: UUID atau BIGINT)
DO $$
DECLARE
  v_id_type text;
BEGIN
  -- Deteksi tipe data kolom id pada tabel public.todos
  SELECT data_type INTO v_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'todos' 
    AND column_name = 'id';

  IF v_id_type = 'uuid' THEN
    EXECUTE '
      CREATE TABLE IF NOT EXISTS public.subtasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
        title TEXT NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone(''utc''::text, now())
      );
    ';
  ELSE
    -- Jika tabel todos menggunakan BIGINT / INT untuk kolom id
    EXECUTE '
      CREATE TABLE IF NOT EXISTS public.subtasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id BIGINT NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
        title TEXT NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone(''utc''::text, now())
      );
    ';
  END IF;
END $$;

-- 2. Index untuk kecepatan query relasional
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks (task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON public.subtasks (user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_created_at ON public.subtasks (created_at);

-- 3. Trigger otomatis pengisian user_id
CREATE OR REPLACE FUNCTION public.handle_subtasks_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_subtasks_user_id ON public.subtasks;
CREATE TRIGGER tr_subtasks_user_id
BEFORE INSERT ON public.subtasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_subtasks_user_id();

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies untuk pengguna solo
DROP POLICY IF EXISTS "Solo user can view own subtasks" ON public.subtasks;
CREATE POLICY "Solo user can view own subtasks"
  ON public.subtasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo user can insert own subtasks" ON public.subtasks;
CREATE POLICY "Solo user can insert own subtasks"
  ON public.subtasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo user can update own subtasks" ON public.subtasks;
CREATE POLICY "Solo user can update own subtasks"
  ON public.subtasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo user can delete own subtasks" ON public.subtasks;
CREATE POLICY "Solo user can delete own subtasks"
  ON public.subtasks FOR DELETE
  USING (auth.uid() = user_id);

