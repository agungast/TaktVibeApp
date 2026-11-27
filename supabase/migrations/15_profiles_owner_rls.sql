-- ==============================================================================
-- MIGRATION: 15_profiles_owner_rls.sql
-- Sprint 2 — profiles dipetakan ke auth.users.id, bukan email.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Baris lama memakai UUID acak. Petakan ke user Auth yang bersesuaian.
UPDATE public.profiles p
SET id = u.id
FROM auth.users u
WHERE lower(p.email) = lower(u.email)
  AND p.id <> u.id
  AND NOT EXISTS (SELECT 1 FROM public.profiles dup WHERE dup.id = u.id);

-- Baris tanpa pemilik hanya cache usang dan bisa dibuat ulang dari metadata.
DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);

-- Store selalu mengirim id; hapus default agar tidak lahir baris yatim lagi.
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id)
      REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
