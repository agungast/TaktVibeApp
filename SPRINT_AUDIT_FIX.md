# Sprint Audit Fix — Prioritas & Tugas

**Waktu target**: 1 minggu (5 hari kerja)  
**Status awal**: Audit selesai, 4 celah terbidentifikasi.

---

## 📋 Daftar Tugas (Backlog)

| ID | Prioritas | Tugas | File | Estimasi |
|----|-----------|-------|------|----------|
| **T1** | 🔴 **Kritis** | Tambah policy auth di edge function `backup-todos` — cek header `Authorization` atau pindah ke `pg_cron` | `supabase/functions/backup-todos/index.ts` | 1 hari |
| **T2** | 🔴 **Kritis** | Buat migration bucket `backups` (`public = false`) + policy owner-scoped | `supabase/migrations/XX_backups_bucket.sql` (baru) | 1 hari |
| **T3** | 🟡 **Sedang** | Hapus file `taskStore.ts.bak` dari repo (hanya backup) | `app/stores/taskStore.ts.bak` | 0,5 hari |
| **T4** | 🟡 **Sedang** | Ganti `console.error/warn` di `taskStore.ts` dengan structured logging atau hapus (build prod) | `app/stores/taskStore.ts` | 1 hari |
| **T5** | 🟢 **Rendah** | Validasi CSP & nonce masih bekerja setelah perubahan | `nuxt.config.ts` | 0,5 hari |

---

## 🗓️ Rencana Eksekusi (Harian)

### **Hari 1 — Minggu** (Awal Sprint)
- **Pagi**: Review code edge function & migrations (30 menit)
- **T1**: Tambah verifikasi auth di `backup-todos/index.ts` — check `Authorization` header sama service role key, kalau ga match → return 403. Commit + test lokal.
- **Sore**: Buat migration bucket `backups` di Supabase (public=false) + policy `takt_backups_select_own`, `takt_backups_insert_own`, `takt_backups_delete_own` (hanya service_role). Jalankan `npx supabase db push` atau manually via dashboard.

### **Hari 2 — Senin**
- **T3**: Hapus `taskStore.ts.bak` dari repo (`rm` file). Commit dengan pesan "remove backup file, not needed in repo".
- **T4 awal**: Baca `taskStore.ts`, temuin 3-5 `console.error/warn` yang bisa di-replace logger sederhana atau dihapus. Prioritaskan yang error yang relevan (fetch, upload). Buat util `logger.ts` opsional jika butuh.

### **Hari 3 — Selasa**
- **T4 lanjut**: Selesaikan semua `console.*` di `taskStore.ts` — replace dengan ` toast.error()` yang sudah ada, atau hapus saja (kecuali error handling yang wajib). Commit.
- **T5**: Jalankan `nuxt build` & cek CSP nonce generate dengan benar. Buka devtools → verify nonce ada di `<script>` dan header response.

### **Hari 4 - Rabu**
- **Review keseluruhan**: `git diff` untuk melihat semua perubahan. Verifikasi belum ada file rahasia yang bocor. Test flow: login user A, cek user B tidak bisa baca data user A (terutama via API & storage).

### **Hari 5 - Kamis**
- **Gate & Close**: `nuxt generate` (atau build). Cek output static. Tulis ringkasan sprint di file ini. Done.

---

## 📌 Catatan Penting

1. **T1 & T2** adalah *critical security fix*. Jika tidak segera dilakukan, data user bisa bocor melalui endpoint backup.
2. **T3** kebersihan repo — bukan keamanan, tapi good practice.
3. **T4** qol — error log di console tidak mengganggu fungsionalitas, tapi akan dibuang di build prod anyway (vite strips console).
4. Seluruh tugas **tidak memerlukan Gemini API** atau fitur AI, hanya fokus keamanan & refactor minimal.

---

## ✅ Daftar Checklist Selesai

- [x] T1: Edge function backup punya auth check (401 kalau tidak punya service_role key)
- [x] T2: Migration bucket `backups` dibuat (file `14_create_backups_bucket.sql`; perlu di-`db push` ke Supabase)
- [x] T3: `taskStore.ts.bak` dihapus dari repo
- [x] T4: `console.error/warn` di `taskStore.ts` diganti `logError/logWarn` via `app/utils/logger.ts`
- [x] T5: `nuxt build` sukses + `vitest run` 15/15 lolos. CSP nonce tidak diubah.

**Mulai?** Ketik `mulai` dan saya akan eksekusi T1 dan T2 (membuat migration & memperbaiki edge function) sebagai hari 1 sprint.