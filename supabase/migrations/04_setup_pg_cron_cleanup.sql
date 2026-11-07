-- ==============================================================================
-- Migration: 04_setup_pg_cron_cleanup.sql
-- Deskripsi: Mengaktifkan ekstensi pg_cron dan menjadwalkan pembersihan otomatis
--             untuk menghapus tugas selesai yang berusia lebih dari 30 hari.
-- ==============================================================================

-- 1. Aktifkan ekstensi pg_cron jika belum aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Hapus job lama jika sudah pernah terdaftar dengan nama yang sama
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-cleanup-tasks') THEN
    PERFORM cron.unschedule('auto-cleanup-tasks');
  END IF;
END $$;

-- 3. Daftarkan jadwal auto-cleanup baru
-- Jadwal: '0 17 * * *' (Setiap hari pukul 17:00 UTC / 00:00 WIB tengah malam)
SELECT cron.schedule(
  'auto-cleanup-tasks',
  '0 17 * * *',
  $$DELETE FROM public.todos WHERE is_completed = true AND created_at < NOW() - INTERVAL '30 days'$$
);

-- 4. Verifikasi pendaftaran job
SELECT jobid, jobname, schedule, command, active FROM cron.job;
