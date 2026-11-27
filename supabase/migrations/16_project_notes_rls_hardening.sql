-- ==============================================================================
-- MIGRATION: 16_project_notes_rls_hardening.sql
-- Sprint 2 — catatan hanya boleh diakses bila project induknya masih dimiliki
-- oleh user yang sama (mencegah akses lewat user_id yang ditanam manual).
-- ==============================================================================

DROP POLICY IF EXISTS "Solo user full access to project_notes" ON public.project_notes;
CREATE POLICY "Solo user full access to project_notes"
  ON public.project_notes
  FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_notes.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_notes.project_id
        AND p.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';
