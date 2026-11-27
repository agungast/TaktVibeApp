# TaktVibe

Aplikasi manajemen tugas & catatan pribadi: Kanban, Kalender, Project Spaces,
subtask, lampiran, dan catatan Markdown. Dibangun dengan **Nuxt 4**, **Vue 3**,
**Pinia**, dan **Supabase**.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env    # lalu isi dengan credentials Supabase Anda
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

> **Catatan build:** Jika VS Code mengeluh `nuxt.d.ts` tidak ditemukan (`.nuxt/tsconfig.app.json`), jalankan `npm run postinstall` (atau `nuxt prepare`). Folder `.nuxt` tidak disertakan dalam repo karena di-generate.

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run preview` | Menjalankan hasil build produksi |
| `npm run generate` | Build statis |

## Konfigurasi

Semua variabel ada di [`.env.example`](./.env.example). Yang wajib diisi:

| Variabel | Keterangan |
| --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NUXT_PUBLIC_SUPABASE_KEY` | Anon / publishable key |

> Jangan pernah menaruh `service_role` key di variabel `NUXT_PUBLIC_*`.
> Kunci itu melewati Row Level Security sepenuhnya.
>
> Tautan reset password memakai `window.location.origin`, jadi tidak perlu
> variabel URL tambahan. Namun domain produksi harus sudah terdaftar di
> **Authentication → URL Configuration → Redirect URLs** pada dashboard
> Supabase, atau email reset akan gagal.

## Setup database

Butuh [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Migrasi dijalankan berurutan sesuai nomor file. `00` membuat tabel dasar,
`01`–`07` menambahkan RLS, lampiran, subtask, dan project space, sedangkan
`08`–`14` berisi perbaikan keamanan untuk project yang sudah berjalan.

> Angka `03` memang dilewati: file tersebut pernah ada namun sudah dihapus.
> Supabase CLI tidak memerlukan nomor migration berurutan.

### Bucket storage

Ada dua bucket, dan pemisahan ini disengaja:

| Bucket | `public` | Isi |
| --- | --- | --- |
| `project-crud` | `true` | Cover tugas & avatar (`public/{userId}/{file}`) |
| `project-crud-private` | `false` | Lampiran privat (`private/{userId}/{file}`) |

Bucket yang ditandai publik di Supabase dilayani tanpa melewati RLS sama
sekali, sehingga file privat **tidak boleh** diletakkan di bucket yang sama
dengan konten publik. Kedua bucket dibuat otomatis oleh
`09_storage_rls_hardening.sql`.

### Cron pengarsipan

`08_archive_completed_tasks.sql` menjadwalkan job `auto-cleanup-tasks` yang
berjalan setiap hari dan memindahkan tugas yang selesai lebih dari 30 hari lalu
ke `status = 'ARCHIVED'`. Job ini **tidak menghapus data**; sebelumnya job
seperti ini memakai `DELETE` dan memfilter `created_at`, sehingga tugas yang
baru saja diselesaikan tetap ikut terhapus.

Untuk melihat status job:

```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'auto-cleanup-tasks';
```

## Pemindahan file privat legacy

Sebelum `09_storage_rls_hardening.sql`, folder `private/` berada di dalam bucket
publik. File lama yang ada di sana **tidak** berpindah otomatis dan selama
masih berada di bucket publik tetap bisa dibaca siapa pun. Untuk menutup celah
ini, jalankan sekali Edge Function `migrate-private-attachments` dengan service
role:

```sh
supabase functions deploy migrate-private-attachments
curl -i -X POST "$SUPABASE_URL/functions/v1/migrate-private-attachments" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Fungsi itu menyalin seluruh `private/**` ke bucket `project-crud-private`, lalu
menghapus sumbernya hanya setelah upload tujuan berhasil. `file_path` di
`task_attachments` tidak perlu diubah karena prefix `private/` yang menentukan
bucket tujuan.

## Struktur

```
app/
  components/     Komponen UI (TaskForm, TaskItem, KanbanCard, modal, dll.)
  composables/    useTheme dan lainnya
  pages/          Halaman: dashboard, login, register, reset-password
  stores/         Pinia: taskStore, authStore, toastStore
  types/          Definisi tipe task.ts
supabase/
  migrations/     Skema database, RLS, dan cron
  functions/      Edge Function: backup-todos (service role)
```

## Catatan keamanan

- `app/stores/taskStore.ts` menyimpan `addTask()` yang mengembalikan boolean;
  pemanggil **wajib** memeriksa nilai itu sebelum mereset form, jika tidak input
  pengguna akan hilang setiap kali insert gagal.
- Semua policy RLS pada tabel anak (`subtasks`, `task_attachments`) memverifikasi
  kepemilikan task induk, bukan sekadar `user_id` kolomnya.
- File privat hanya disajikan lewat Signed URL berumur 1 jam.
- Header keamanan (CSP, HSTS, `frame-ancestors`, dll.) diatur di `nuxt.config.ts`.
  CSP memakai nonce (`nonce: true`, `'nonce-{{nonce}}'`, `'strict-dynamic'`),
  jadi skrip inline baru tidak perlu hash SHA-256 dihitung manual.