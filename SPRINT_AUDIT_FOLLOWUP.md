# Sprint Follow-up: Audit Bug, Keamanan & Kesehatan Repo

**Status**: Sprint 2 selesai (25 Nov 2026)  
**Sumber**: audit read-only 25 Nov 2026 (4 jalur: backend/security, data/store, UI/a11y, config/lean)  
**Asumsi beban**: aplikasi tugas personal dengan OAuth, banyak user, sesekali beberapa tab aktif.

## Aturan main

- Urutan: **benar → aman → beban → tested → lean**.
- Satu sprint = satu commit kecil. Jangan campur perbaikan dengan redesign visual.
- Routes, alur data, auth, dan logika Supabase tetap dipertahankan.
- Gate tiap sprint: `npm run test`, `npm run build`, dan `node .agents/skills/design-taste-frontend/scripts/lint.mjs app`.
- Jika menyentuh UI: jalankan inspector produksi untuk route terkait.
- Google OAuth SVG tetap memakai warna brand resmi (`#EA4335`, `#4285F4`, `#FBBC05`, `#34A853`).

---

## Sprint 0 — Quick wins (target 30–60 menit)

- [x] **S0.1 Pomodoro double-count** — `app/stores/focusStore.ts:119-125`, `app/stores/taskStore.ts:917-927`. Hapus dua baris yang menaikkan `activeTask.actual_hours` di `focusStore`; biarkan `logFocusTime` sebagai satu-satunya penulis. Cek: 1 sesi 25 menit dari 0 → `0.4h` di UI dan DB.
- [x] **S0.2 Backup guard & kolom** — `supabase/functions/backup-todos/index.ts:9-11,18-26`. Fail-fast kalau `SUPABASE_SERVICE_ROLE_KEY` kosong; ganti `updated_at` dengan `completed_at`. Cek: cron tidak lagi 500 `42703`.
- [x] **S0.3 Quick-parse fallback** — `server/api/ai/quick-parse.post.ts:46-47`. Konversi menit `/60`, detik `/3600`, dan `parseFloat(m[1].replace(',', '.'))`. Tambah satu assert test nyata di `test/quick-parse.spec.ts`. Cek: `30 menit → 0.5`, `1,5 jam → 1.5`.
- [x] **S0.4 Cakupan CI** — `.github/workflows/ci.yml:4-11`. Tambahkan `feat/ui-redesign` ke `push`/`pull_request` agar branch ini benar-benar ter-CI.

**Gate**: test + build. Tidak ada perubahan UI.

---

## Sprint 1 — Data correctness di `taskStore`

- [x] **S1.1 Subtask false-success** — `app/stores/taskStore.ts:1140-1161,1197-1200`. Rollback `temp-*` saat insert gagal; jangan toast sukses saat delete/toggle gagal.
- [x] **S1.2 Metadata lampiran false-success** — `taskStore.ts:646-656`. Saat insert `task_attachments` gagal, hapus file yang sudah terupload via `removeStoragePaths`, lalu gagalkan `addTask`.
- [x] **S1.3 Fallback skema membuang field** — `taskStore.ts:590-631,893-908`. Setelah fallback sukses, refetch row atau finite-toast “sebagian field tidak tersimpan” agar state lokal cocok DB.
- [x] **S1.4 Rollback `deleteProject`** — `taskStore.ts:1345-1378`. Snapshot `project_id`/`project` task terdampak + `activeProjectId`, restore di kedua cabang error.
- [x] **S1.5 Rollback `updateTaskProject` & project phantom** — `taskStore.ts:1385-1413,1250-1277`, `app/components/ProjectModal.vue:190-196`. Restore `project_id` lama saat error; hapus `temp-proj-*` dari `projects` saat insert gagal dan jangan tutup modal.
- [x] **S1.6 Avatar lokal terhapus duluan** — `app/stores/authStore.ts:534-540,601-604`. Tulis `localAvatarUrl`, `avatarDeleted`, dan `sessionStorage` hanya setelah `updateUser` sukses.

**Cek manual**: simulasi error DB/RLS (mis. cabut izin sementara di tujuan) → toast sukses tidak muncul, state lokal kembali seperti semula.  
**Gate**: test + build.

---

## Sprint 2 — Keamanan, storage, dan biaya AI

- [x] **S2.1 Kuota AI** — `nuxt.config.ts:69`, `server/api/ai/*.post.ts`. Batasi panjang field ~2000 karakter dan tambah kuota per user untuk `/api/ai/**`; tidak perlu mengaktifkan rate limiter global.
- [x] **S2.2 Hapus lampiran privat salah bucket** — `app/stores/taskStore.ts:759-761`. Ganti `.from('project-crud').remove(...)` dengan `removeStoragePaths([attachment.file_path])`.
- [x] **S2.3 Objek privat legacy** — `supabase/migrations/09_storage_rls_hardening.sql:57-59`. Tambah migration/service script untuk memindahkan `project-crud/private/**` ke `project-crud-private/private/**` lalu hapus yang lama.
- [x] **S2.4 Tabel `profiles`** — `app/stores/authStore.ts:61,90,630-634`, `docs/AVATAR_SYNC_PROFILE_PICTURE.md:147-194`. Buat migration `id UUID REFERENCES auth.users(id)` + RLS `auth.uid() = id`; ubah store dari `email` ke `user.value.id`.
- [x] **S2.5 RLS `project_notes`** — `supabase/migrations/13_create_project_notes.sql:42-46`. Tambah `EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_notes.project_id AND p.user_id = auth.uid())` di `USING`/`WITH CHECK`.
- [x] **S2.6 Token expired → 500** — handler `server/api/ai/*.post.ts`. Bungkus `serverSupabaseUser` dengan helper yang mengubah error menjadi 401.
- [x] **S2.7 Backup per-user & CSV injection** — `supabase/functions/backup-todos/index.ts:37-61`. Group by `user_id`, tulis `backups/{userId}/todos_{date}.csv`, prefix `'` untuk sel diawali `= + - @`.

**Gate**: test + build + verifikasi migration di Supabase staging. Jangan deploy perubahan RLS tanpa backup.

---

## Sprint 3 — Keyboard & aksesibilitas

- [ ] **S3.1 Modal utama** — `app/components/FocusTimer.vue:68`, `app/components/TaskDetailModal.vue:4-10`, `TaskItem.vue:184-317`, `KanbanCard.vue:169-301`. Fokus root saat buka, Escape via `document`, trap Tab, restore fokus saat tutup, `role="dialog"` + `aria-modal` konsisten.
- [ ] **S3.2 Menu aksi teleport** — `app/components/TaskItem.vue:156-178,505-569`. Fokus item pertama, arrow up/down, Escape menutup dan mengembalikan fokus ke trigger.
- [ ] **S3.3 Date picker** — `app/components/DatePicker.vue:3-28,31-83`. Tombol hapus tanggal jadi sibling, bukan nested; tambah arrow-key, `aria-label` tanggal lengkap, `aria-selected`, restore fokus ke trigger.
- [ ] **S3.4 Drag-only → ada alternatif** — `app/components/CalendarView.vue:143-155`, `app/components/KanbanBoard.vue:22-32`, `app/components/KanbanCard.vue:2-8`. Tambah tombol “Jadwalkan” dan “Pindah ke…” memakai kontrol yang sudah ada.
- [ ] **S3.5 Password toggle & state** — `app/pages/login.vue:87-93`, `register.vue:85-91`, `reset-password.vue:45-51`. Hapus `tabindex="-1"`, tambah `aria-label`/`aria-pressed`; tambah `:aria-pressed` pada segmented priority/view/mode di `TaskForm.vue`, `TaskItem.vue`, `KanbanCard.vue`, `dashboard.vue`, `analytics.vue`, `index.vue`, `FocusTimer.vue`.

**Gate**: test + build + lint + inspector pada `/login`, `/register`, `/dashboard`. Pakai `--allow font-not-dealt` seperti sebelumnya.

---

## Sprint 4 — Tests, lean, dan deploy hygiene

- [ ] **S4.1 Test nyata** — hapus placeholder di `test/taskCore.spec.ts`, `taskStore.spec.ts`, `taskStatus.spec.ts`, `test/server/ai-*.spec.ts`; ganti dengan minimal satu test yang import kode aplikasi (mis. `useTaskCore` dengan stub ctx).
- [ ] **S4.2 Modul mati** — hapus `app/stores/modules/taskCore.ts`, `taskAttachments.ts`, `taskProjectsNotesTemplates.ts` (~500 baris, tidak di-import) dan baris checklist lama di `TASK_FIXING_AUDIT.md:9-11`.
- [ ] **S4.3 CLI state ter-track** — `git rm -r --cached supabase/.temp`, tambah `supabase/.temp/` ke `.gitignore:1-24`.
- [ ] **S4.4 Dokumen drift** — `README.md:52-56` ubah rentang migrasi ke `14`; `README.md:137-138` ganti catatan hash SHA-256 dengan nonce CSP.
- [ ] **S4.5 `.env` lokal** — ganti `SUPABASE_URL`/`SUPABASE_KEY` dengan `NUXT_PUBLIC_SUPABASE_URL`/`NUXT_PUBLIC_SUPABASE_KEY` sesuai `.env.example:14,17`.
- [ ] **S4.6 Gemini key saat build** — `nuxt.config.ts:16` set `geminiApiKey: ''`; pakai env runtime `NUXT_GEMINI_API_KEY`; hapus fallback `|| process.env.GEMINI_API_KEY` di 4 handler AI. Rotasi key jika pernah ada di artifact.
- [ ] **S4.7 Aset & dependency mati** — hapus `public/images/logo-badge-{light,dark}.png` (~560 KB) dan `jsdom` dari `package.json:25`; hapus `app/types/project.ts`, interface `UserProfile`/`AuthState` di `app/types/auth.ts:15-26`, dan `app/layouts/base.vue`.

**Gate**: `npm ci` bersih, test + build + lint 0 FAIL.

---

## Ditolak setelah verifikasi — jangan dikerjakan ulang

- `NODE_ENV: test` di CI **tidak** membuat cookie insecure; `nuxt build` memaksa `production` (`node_modules/@nuxt/cli/dist/build-BruCr8zc.mjs:37`). Yang nyata hanya cakupan branch (S0.4).
- Key Gemini **tidak** ditemukan di `.output` lokal. Risikonya hanya pola build-time (S4.6), bukan kebocoran yang terkonfirmasi.
- `favicon-32.png` tidak ada; yang unused hanya dua `logo-badge-*.png`.
- 93 WARN lint dan 3 WARN inspector (`hero-void`, `below-fold`, `app-title-size`) disengaja/defensible — bukan utang sprint ini.

## Log progres

| Sprint | Status | Commit | Catatan |
| --- | --- | --- | --- |
| 0 — Quick wins | Selesai | `4965140` | test + build lulus |
| 1 — Data correctness | Selesai | `57f5ebc` | test 9 file/16 test + build lulus; cek manual error DB/RLS belum dijalankan |
| 2 — Security/storage/AI | Selesai | lihat git log | test 13 file/22 test + build lulus; migration 15/16 & Edge Function legacy belum diverifikasi di staging |
| 3 — Keyboard/a11y | Belum dimulai | — | |
| 4 — Tests/lean/deploy | Belum dimulai | — | |
