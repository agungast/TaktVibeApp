# Dokumentasi Sinkronisasi Avatar & Profile Picture

Dokumentasi ini merangkum cara kerja sinkronisasi foto profil (avatar) di aplikasi TaktVibe agar konsisten antara login manual, login Google, upload, hapus, logout/login kembali, serta mencegah foto Google kembali muncul setelah pengguna mengganti fotonya.

## 1. Latar Belakang Masalah

Sebelum perbaikan, terdapat beberapa sumber yang bisa menjadi avatar:

- `user.user_metadata.avatar_url` / `user.user_metadata.picture`
- `user.identities[].identity_data.avatar_url` / `.picture` (foto dari provider OAuth seperti Google)
- `localAvatarUrl` di store (hanya ada di memori)
- Cache browser (`localStorage` / `sessionStorage`)
- Tabel `profiles` di Supabase

Akibatnya prioritas antar sumber bisa bertabrakan, terutama saat:

- Login Google vs login manual dengan email yang sama (bisa beda `auth.users.id`)
- Upload foto baru kemudian hard refresh / logout-login
- Tekan "Hapus Foto" lalu kembali login
- Supabase meng-overwrite metadata saat re-auth OAuth

## 2. Sumber Kebenaran

**Sumber kebenaran utama adalah tabel `profiles` berdasarkan `email`.**

Alasan:

- Login manual dan Google bisa menggunakan email yang sama meski `auth.users.id` berbeda.
- `profiles` bisa disimpan/di-upsert langsung oleh aplikasi saat user mengubah profil.
- Memungkinkan konsistensi lintas metode login tanpa harus meng-link account di Supabase Auth.

Skema minimal:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

> Catatan: Pada implementasi saat ini kita hanya menggunakan `email`, `full_name`, dan `avatar_url`. Kolom lain bisa ditambahkan sesuai kebutuhan.

## 3. Arsitektur Solusi

### 3.1 State di `app/stores/authStore.ts`

| State | Tipe | Kegunaan |
|---|---|---|
| `localAvatarUrl` | `Ref<string \| null>` | Override lokal hasil aksi user (upload/hapus). Disimpan ke `localStorage` (`avatar_url`) agar bertahan saat hard refresh. |
| `avatarDeleted` | `Ref<boolean>` | "Kunci" bahwa user secara manual telah menghapus fotonya. Disimpan ke `localStorage` (`avatar_deleted`). Digunakan untuk mencegah fallback ke foto Google/metadata. |
| `localFullName` | `Ref<string \| null>` | Nama lokal untuk sinkronisasi cepat. |
| `user` | `Ref<User \| null>` (dari `useSupabaseUser`) | User dari Supabase Auth. |

### 3.2 Helper `syncFromProfiles()`

Fungsi ini menjadi jembatan antara tabel `profiles` dan store.

```ts
async function syncFromProfiles(force = false): Promise<void> {
  const email = user.value?.email
  if (!email) return
  try {
    const { data: profileData } = await supabase.from('profiles').select('avatar_url').eq('email', email).maybeSingle()
    if (profileData?.avatar_url) {
      localAvatarUrl.value = profileData.avatar_url
      avatarDeleted.value = false
      try { sessionStorage.setItem(`profile_avatar_${email}`, profileData.avatar_url) } catch {}
    } else {
      avatarDeleted.value = true
      localAvatarUrl.value = ''
      try { sessionStorage.setItem(`profile_avatar_${email}`, '__deleted__') } catch {}
    }
  } catch {}
}
```

Kapan dipanggil:

- `signIn()` setelah berhasil mendapatkan user
- `signInWithOAuth()` setelah `getUser()` dan berhasil membaca dari `profiles`
- `watch(user, ...)` saat user berganti akun (`oldUser && newUser.id !== oldUser.id`)
- `updateUserProfile()` setelah `upsert` ke `profiles`

### 3.3 Prioritas di `avatarUrl` computed

`avatarUrl` adalah **single resolver**. Komponen cukup baca `authStore.avatarUrl`, store yang memutuskan nilai akhirnya.

| Urutan | Kondisi | Penjelasan |
|---|---|---|
| **0** | `sessionStorage` (`profile_avatar_${email}`) | Prioritas tercepat. Jika `__deleted__` → `null`. Jika ada URL → langsung return. Mencegah flicker saat login/perpindahan sesi. |
| **1** | `localAvatarUrl` | Jika `''` → `null` (status "dihapus"). Jika berisi URL → return (hasil upload terbaru di sesi ini). |
| **2** | `avatarDeleted` | Jika `true` → `null`. Mengunci agar tidak jatuh ke fallback OAuth/metadata. |
| **3** | `user_metadata.avatar_url` (bukan OAuth URL) | Hanya untuk custom upload yang tersimpan di metadata. Dilewati jika URL berasal dari provider OAuth. |
| **4** | `identities[].identity_data.avatar_url` / `.picture` | Foto dari Google/GitHub. **Hanya dipakai jika belum ada override custom/hapus**. |
| **5** | `user_metadata.picture` / fallback | Fallback terakhir, tetap dicek `avatarDeleted`. |

Dengan urutan ini, foto custom dari `profiles`/upload akan selalu menang atas foto Google.

## 4. Alur Perilaku

### 4.1 Upload Foto Baru
1. User pilih file di `ProfileModal.vue` → `previewAvatarUrl` jadi `blob:`
2. `handleSaveProfile()` panggil `authStore.updateUserProfile({ avatarFile: ... })`
3. `updateUserProfile()` upload file ke Supabase Storage (`project-crud/public/${userId}/...`) → dapat public URL
4. `localAvatarUrl = publicUrl`, `avatarDeleted = false`
5. Update `user_metadata` (`avatar_url`, `picture`) via `supabase.auth.updateUser()`
6. `getUser()` untuk refresh user
7. `upsert` ke tabel `profiles` dengan `email` + `avatar_url`
8. Update `sessionStorage.setItem(profile_avatar_${email}, publicUrl)`
9. `avatarUrl` computed langsung update → UI berubah tanpa hard refresh

### 4.2 Hapus Foto
1. User klik "Hapus Foto" → `removeAvatarRequested = true`, `previewAvatarUrl = null`
2. `updateUserProfile({ removeAvatar: true })`
3. `localAvatarUrl = ''`, `avatarDeleted = true`
4. Kirim `avatar_url: null`, `picture: null` ke `user_metadata`
5. `getUser()` refresh
6. `upsert` ke `profiles` dengan `avatar_url: null`
7. `sessionStorage.setItem(profile_avatar_${email}, '__deleted__')`
8. `avatarUrl` → `null` → tampil inisial. Tombol "Hapus Foto" menjadi disabled
9. Setelah logout/login atau hard refresh, tetap default (tidak kembali ke foto Google)

### 4.3 Login Manual
1. `signIn()` sukses → dapat user → bisa panggil `syncFromProfiles()`
2. Jika ada entry di `profiles` untuk email tersebut → ambil `avatar_url`/`full_name`
3. `avatarUrl` akan meresolve ke foto dari `profiles` atau sesuai prioritas

### 4.4 Login Google (OAuth)
1. `signInWithOAuth()` redirect → callback
2. `getUser()` → dapat user baru
3. **Langsung sync dari `profiles` berdasarkan `email`**. Jika ditemukan `avatar_url` di `profiles`, set `localAvatarUrl`, `avatarDeleted = false`, simpan ke `sessionStorage`, dan **return true** (skip `hydrateAvatarFromMeta()` agar tidak jatuh ke foto Google)
4. Jika tidak ada di `profiles` (first time), baru fallback ke `user_metadata`/`identity_data`

### 4.5 Hard Refresh
1. `localAvatarUrl` dimuat dari `localStorage`
2. `avatarDeleted` dimuat dari `localStorage`
3. `watch(user)` hanya reset jika **benar-benar pindah akun** (`oldUser && newUser.id !== oldUser.id`). Saat inisialisasi (`oldUser = undefined`) **tidak reset**, jadi tidak ada flicker
4. `avatarUrl` baca `sessionStorage` → `localStorage` → dst. Tanpa menampilkan foto Google sesaat

## 5. Setup Supabase

### 5.1 Tabel & Kolom
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
```

### 5.2 RLS & Policy
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

NOTIFY pgrst, 'reload schema';
```

### 5.3 Tips
- **Realtime** bisa tetap `DISABLED`. Tidak berpengaruh untuk `select/insert/update`.
- Gunakan `.maybeSingle()` alih-alih `.single()` saat query ke `profiles` (aman jika baris belum ada).
- Pastikan tidak mengirim kolom yang tidak ada (seperti `picture`) ke tabel `profiles`.

## 6. Checklist untuk Project Baru

- [ ] **Buat tabel `profiles`** dengan `email` unik + `avatar_url` + `full_name`
- [ ] **Pasang RLS + policy** berbasis `auth.jwt() ->> 'email'`
- [ ] **Buat `syncFromProfiles()`** di auth store untuk membaca/upsert ke `profiles`
- [ ] **Buat computed `avatarUrl` dengan prioritas terpusat** (cache → local → deleted → custom metadata → identity OAuth)
- [ ] **Guard `watch(user)`**: jangan reset saat inisialisasi, hanya saat benar-benar ganti akun
- [ ] **Persist state kritikal**: simpan `localAvatarUrl`, `avatarDeleted` ke `localStorage`
- [ ] **Gunakan cache `sessionStorage`** untuk menghindari flicker/fallback ke foto Google
- [ ] **Upsert ke `profiles`** setiap update profil (upload/hapus/ganti nama)
- [ ] **Prioritaskan `profiles` di `signInWithOAuth`** sebelum fallback ke `hydrateAvatarFromMeta()`
- [ ] **Handle hapus dengan flag** (`''` + `avatarDeleted = true` + `__deleted__`)
- [ ] **Panggil `getUser()` setelah `updateUser()`** untuk dapat metadata/server state terbaru

## 7. File Terkait

| File | Peran |
|---|---|
| `app/stores/authStore.ts` | Inti sinkronisasi avatar, `syncFromProfiles()`, computed `avatarUrl`, alur upload/hapus, sync OAuth/manual |
| `app/components/ProfileModal.vue` | Preview avatar, tombol "Pilih Foto Baru"/"Hapus Foto", form edit profil, sinkron `previewAvatarUrl` dengan `authStore.avatarUrl` |
| `app/components/AppHeader.vue` | Avatar di header (pakai `authStore.avatarUrl` + `:key`) |
| `app/layouts/default.vue` | Avatar di sidebar (pakai `authStore.avatarUrl` + `:key`) |
| `nuxt.config.ts` | CSP (tambahkan domain Google/Supabase jika dibutuhkan) |

## 8. Pelajaran Penting

- **Satu resolver, bukan lima sumber**: Semua komponen harus membaca `authStore.avatarUrl`. Jangan ada yang menghitung ulang logika avatar sendiri.
- **Prioritaskan data aplikasi, bukan provider**: Foto hasil upload pengguna harus selalu menang atas foto bawaan Google.
- **Jangan andalkan computed async**: Sinkronkan dulu ke `ref/cache`, baru computed baca.
- **Persist untuk mencegah flicker**: `localStorage` + `sessionStorage` krusial buat UX yang mulus saat hard refresh/login ulang.
- **Bersihkan dengan benar**: Saat hapus, set `''` + `avatarDeleted = true` dan pastikan semua fallback di-skip (termasuk `identity_data`).
- **RLS & schema wajib dicek**: Error `406/400` hampir selalu karena RLS/policy/kolom/`schema cache` yang belum sesuai.
- **Gunakan `.maybeSingle()`**: Lebih aman dibanding `.single()` saat kemungkinan baris belum ada di tabel.