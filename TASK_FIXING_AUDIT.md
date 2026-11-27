# TASK FIXING - Sprint Audit (Must Fix + Should Fix)

## MUST FIX

### 1. Pecah `taskStore.ts` jadi modul kecil + tambah tes kritis
- **File**: `app/stores/taskStore.ts` (57KB / 1588 baris) - MONOLITH
- **Problem**: Semua CRUD + storage + template + project + notes + lightbox dalam 1 file. Tidak ada tes untuk path kritis.
- **Fix**:
  - [ ] Refactor `taskStore.ts` jadi composer (`defineStore` + spread)
  - [ ] Tambah tes `test/taskCore.spec.ts` untuk `addTask` (sukses + gagal)
  - [ ] Tambah tes `test/taskStatus.spec.ts` untuk `updateTaskStatus` (optimistic update + rollback)
- **Priority**: P0
- **Effort**: L
- **Risk**: Tinggi (bisa break seluruh CRUD)

### 2. Tambah server test untuk AI endpoints (chat/briefing/quick-parse/breakdown)
- **Files**: `server/api/ai/*.post.ts`
- **Problem**: Hanya ada 2 spec ringan. Tidak ada tes fallback JSON parse/error.
- **Fix**:
  - [ ] Tambah `test/server/ai-chat.spec.ts` - empty input + fallback
  - [ ] Tambah `test/server/ai-briefing.spec.ts` - fallback + struktur JSON
  - [ ] Tambah `test/server/ai-quick-parse.spec.ts` - expand (urgent/high/low, hours, fallback)
  - [ ] Tambah `test/server/ai-breakdown.spec.ts` - fallback + sanitize
- **Priority**: P0
- **Effort**: M
- **Risk**: Sedang

### 3. Perbaiki CSV export agar aman (escaping + size limit)
- **File**: `app/pages/analytics.vue` (lines ~84-96)
- **Problem**: Title dengan koma/enter/quote bisa merusak CSV. Tidak ada batasan.
- **Fix**:
  - [ ] Tambah helper `escapeCsv(val)` (quote + double-quote)
  - [ ] Escape semua field (title, status, priority)
  - [ ] Batasi export max 1000 baris + warning toast
  - [ ] Pertimbangkan export filtered saja (opsional)
- **Priority**: P0
- **Effort**: S
- **Risk**: Rendah

## SHOULD FIX

### 4. Pastikan CommandPalette load data detail tugas dengan aman
- **File**: `app/components/CommandPalette.vue:58`
- **Problem**: `taskStore.openDetailModal(t)` bisa tampil stale jika modal tidak fetch subtasks/attachments
- **Fix**:
  - [ ] Ubah jadi `taskStore.openDetailModal(t)` tetap aman, atau fetch ulang saat modal dibuka
  - [ ] Cek `TaskDetailModal.vue` - pastikan load subtasks jika belum ada
- **Priority**: P1
- **Effort**: S
- **Risk**: Sedang

### 5. Tambahkan Install PWA button
- **Files**: `nuxt.config.ts` (sudah ada pwa config) + UI
- **Problem**: Manifest ada tapi tidak ada UI install prompt
- **Fix**:
  - [ ] Tambah composable `app/composables/usePwaInstall.ts` (beforeinstallprompt)
  - [ ] Tambah tombol "Install Aplikasi" di `AppHeader.vue` atau sidebar footer
  - [ ] Tampilkan hanya jika bisa di-install + belum installed
- **Priority**: P1
- **Effort**: S
- **Risk**: Rendah

### 6. Optimasi landing page `/` (code-split)
- **File**: `app/pages/index.vue` (45KB)
- **Problem**: Large landing page untuk unauthenticated users
- **Fix**:
  - [ ] Lazy-load `FeatureTour.vue` dengan `defineAsyncComponent`
  - [ ] Pastikan CSS ter-split
  - [ ] Atau pindahkan sebagian section ke composable
- **Priority**: P1
- **Effort**: S
- **Risk**: Rendah

## VALIDATION
- [ ] `npm run test -- --run` lulus
- [ ] `npm run build` sukses tanpa error
- [ ] Manual test: CRUD, AI fallback, export CSV, CommandPalette, PWA install
- [ ] Tidak ada perubahan schema Supabase yang merusak RLS

## NOTES
- Jangan hapus fitur yang sudah ada (Sprint 1-8)
- Gunakan pola kode existing (TypeScript strict, vanilla CSS, Nuxt 4)
- Test minimal cukup, bukan coverage 100%
- Split store hati-hati - pastikan semua action ter-export
