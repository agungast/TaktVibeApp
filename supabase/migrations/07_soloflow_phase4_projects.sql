-- ==============================================================================
-- MIGRATION: 07_soloflow_phase4_projects.sql
-- DESKRIPSI: Tabel `projects` (Spaces ala Notion), RLS Policies, dan Relasi ke `todos`
--            SoloFlow Fase 4: Project Spaces & Manajemen Ruang Kerja
-- ==============================================================================

-- 1. Buat tabel projects (Spaces)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁' NOT NULL,
  color TEXT DEFAULT '#38bdf8' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tambahkan kolom project_id ke tabel public.todos
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 3. Index untuk optimasi query relasional
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects (created_at);
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON public.todos (project_id);

-- 4. Trigger otomatis pengisian user_id untuk tabel projects
CREATE OR REPLACE FUNCTION public.handle_projects_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_projects_user_id ON public.projects;
CREATE TRIGGER tr_projects_user_id
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_projects_user_id();

-- 5. Aktifkan Row Level Security (RLS) pada tabel projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies untuk tabel projects
DROP POLICY IF EXISTS "Solo user can view own projects" ON public.projects;
CREATE POLICY "Solo user can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo user can insert own projects" ON public.projects;
CREATE POLICY "Solo user can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo user can update own projects" ON public.projects;
CREATE POLICY "Solo user can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo user can delete own projects" ON public.projects;
CREATE POLICY "Solo user can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);
