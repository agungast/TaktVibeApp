# 📖 Panduan Lengkap Pengguna TaktVibe (User Guide)

Selamat datang di **TaktVibe** — *Personal Task & Knowledge Management System* modern yang dirancang untuk mendukung alur kerja cepat (*SoloFlow*), minim distraksi, dan berbasis *deep work*.

Dokumen ini memuat panduan komprehensif mengenai seluruh fitur yang tersedia di TaktVibe, mulai dari registrasi akun hingga optimasi produktivitas dengan kecerdasan buatan (AI).

---

## 📑 Daftar Isi
1. [Memulai & Autentikasi](#1-memulai--autentikasi)
2. [Tampilan Utama & Dasbor (Dashboard)](#2-tampilan-utama--dasbor-dashboard)
3. [Manajemen Tugas (Task Management)](#3-manajemen-tugas-task-management)
4. [Ruang Kerja & Wiki Catatan (Spaces / Projects & Notes)](#4-ruang-kerja--wiki-catatan-spaces--projects--notes)
5. [Template Tugas (Task Templates)](#5-template-tugas-task-templates)
6. [Mode Fokus Pomodoro (Focus Timer)](#6-mode-fokus-pomodoro-focus-timer)
7. [TaktVibe Copilot (Asisten AI)](#7-taktvibe-copilot-asisten-ai)
8. [Analitik & Ekspor Data (Analytics & AI Briefing)](#8-analitik--ekspor-data-analytics--ai-briefing)
9. [Command Palette & Pintasan Keyboard](#9-command-palette--pintasan-keyboard)
10. [Pengaturan Profil & Personalisasi Tema](#10-pengaturan-profil--personalisasi-tema)
11. [Dukungan Progressive Web App (PWA)](#11-dukungan-progressive-web-app-pwa)

---

## 1. Memulai & Autentikasi

TaktVibe menyediakan opsi autentikasi yang fleksibel dan aman yang didukung oleh Supabase Auth dan PostgreSQL *Row-Level Security* (RLS).

### A. Registrasi Akun Baru
1. Kunjungi halaman `/register`.
2. Masukkan **Nama Lengkap**, **Email**, dan **Kata Sandi** (minimal 6 karakter).
3. Konfirmasi kata sandi Anda dan klik tombol **Daftar Sekarang**.
4. Jika verifikasi email aktif di sistem, periksa kotak masuk email Anda untuk mengonfirmasi tautan pendaftaran.

### B. Masuk (Login)
1. Buka halaman `/login`.
2. **Email & Password**: Masukkan kredensial Anda lalu klik **Masuk Sekarang**.
3. **Single Sign-On (OAuth)**: Klik tombol **Masuk dengan Google** atau **Masuk dengan GitHub** untuk login instan dengan satu klik.

### C. Pemulihan Kata Sandi (Forgot / Reset Password)
- Jika lupa kata sandi, buka menu **Lupa kata sandi?** di halaman login (`/forgot-password`).
- Masukkan email terdaftar dan sistem akan mengirim tautan pemulihan.
- Buka tautan dari email Anda untuk membuat kata sandi baru di halaman `/reset-password`.

---

## 2. Tampilan Utama & Dasbor (Dashboard)

Dasbor utama (`/dashboard`) adalah pusat kendali semua aktivitas Anda.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AppHeader: [Cari / Cmd+K] [Filter] [Fokus] [Tema 🌙/☀️] [Profil]       │
├───────────────┬─────────────────────────────────────────────────────────┤
│ Sidebar       │ Tampilan Utama (View Switcher: Kanban | List | Calendar) │
│ • Semua Tugas │                                                         │
│ • Ruang Kerja │ [ + Buat Tugas Cepat / Template ]                       │
│   - Coding    │                                                         │
│   - Riset     │  [TODO]      [IN_PROGRESS]    [REVIEW]     [DONE]       │
│ • Analitik    │  ┌─────────┐ ┌─────────────┐  ┌──────────┐ ┌──────────┐ │
│ • PWA Install │  │ Tugas A │ │ Tugas B     │  │ Tugas C  │ │ Tugas D  │ │
│               │  └─────────┘ └─────────────┘  └──────────┘ └──────────┘ │
└───────────────┴─────────────────────────────────────────────────────────┘
```

### Navigasi Mode Tampilan (View Modes)
Anda dapat berganti tampilan tugas melalui tombol di bagian atas dasbor:
1. **Kanban Board** (`🗂️`): Menampilkan kolom status visual dengan dukungan drag-and-drop.
2. **Tabel / List View** (`📋`): Tampilan ringkas berbasis baris yang cocok untuk memindai banyak tugas sekaligus secara cepat.
3. **Kalender** (`📅`): Memetakan tugas berdasarkan tanggal jatuh tempo (*due date*) per bulan atau minggu.

### Filter Cepat (Quick Filters)
Saring tugas dengan satu klik pada tombol filter di atas dasbor:
- **Semua**: Menampilkan seluruh tugas yang belum diarsipkan.
- **Aktif**: Menampilkan tugas yang masih berjalan (bukan status *DONE* atau *ARCHIVED*).
- **Hari Ini**: Tugas dengan tenggat waktu hari ini.
- **Terlambat (Overdue)**: Tugas yang telah melewati tanggal tenggat namun belum diselesaikan.
- **Selesai**: Seluruh tugas yang sudah berstatus *DONE*.

---

## 3. Manajemen Tugas (Task Management)

### A. Membuat Tugas Baru
- **Cara Cepat**: Ketik judul tugas pada kolom input di atas dasbor lalu tekan `Enter`.
- **Form Lengkap**: Klik tombol **+ Buat Tugas** untuk membuka modal form detail.
- **Pintasan Keyboard**: Tekan tombol `c` di luar input untuk membuka dialog pembuatan tugas.

### B. Atribut & Informasi Tugas
Setiap tugas dapat dilengkapi atribut berikut:
- **Status Alur Kerja**:
  - `TODO` (Belum Dikerjakan)
  - `IN_PROGRESS` (Sedang Dikerjakan)
  - `REVIEW` (Dalam Peninjauan / Testing)
  - `DONE` (Tuntas)
  - `ARCHIVED` (Arsip)
- **Prioritas**:
  - 🟢 **Rendah (Low)**: Tugas fleksibel.
  - 🔵 **Sedang (Medium)**: Standar harian.
  - 🟠 **Tinggi (High)**: Membutuhkan perhatian segera.
  - 🔴 **Mendesak (Urgent)**: Prioritas kritis yang harus segera dituntaskan.
- **Estimasi vs Waktu Aktual**:
  - *Estimasi*: Masukkan perkiraan jam kerja (misal: 2 jam).
  - *Aktual*: Dicatat manual atau otomatis terisi melalui sesi Pomodoro Focus Timer.
- **Tenggat Waktu (Due Date)**: Pilih tanggal melalui pemilih tanggal visual dengan preset cepat (Hari Ini, Besok, Minggu Depan).
- **Label / Tag**: Tambahkan tag kategori (misal: `frontend`, `bug`, `docs`).
- **Ruang Kerja (Project Space)**: Kelompokkan tugas ke proyek tertentu.

### C. Subtasks (Langkah Kerja / Checklist)
Pecah tugas besar menjadi bagian-bagian kecil:
1. Buka detail tugas dengan mengklik kartu/baris tugas.
2. Pada bagian **Subtasks**, ketik nama langkah kerja lalu tekan `Enter`.
3. Centang kotak checklist ketika suatu langkah selesai; progres persentase akan terbarui secara otomatis.

### D. Lampiran File & Gambar (Attachments)
1. Di dalam modal detail tugas, buka bagian **Lampiran**.
2. Unggah file dokumen atau gambar (format JPG, PNG, WebP, PDF, dsb.).
3. Klik pada thumbnail gambar untuk membukanya dalam mode pratinjau layar penuh (**Image Lightbox**).

---

## 4. Ruang Kerja & Wiki Catatan (Spaces / Projects & Notes)

Ruang Kerja (*Spaces*) memisahkan konteks tugas agar Anda tidak tercampur antara pekerjaan kantor, proyek sampingan, dan kebutuhan pribadi.

### A. Membuat & Mengelola Proyek
1. Pada sidebar sebelah kiri, klik ikon **+** di samping header *Ruang Kerja*.
2. Masukkan **Nama Proyek**, pilih **Ikon Emoji** (contoh: 🚀, 💻, 📚), dan pilih **Warna Aksen**.
3. Klik **Simpan**.
4. Klik salah satu ruang kerja di sidebar untuk menyaring dasbor hanya pada proyek tersebut.

### B. Wiki & Catatan Teknis (Project Notes)
Setiap proyek memiliki buku catatan berbasis Markdown terintegrasi:
1. Klik ikon dokumen / buku di samping nama ruang kerja di sidebar.
2. Modal **Wiki & Catatan** akan terbuka.
3. Klik **+ Catatan Baru** untuk membuat lembar catatan.
4. Tulis dokumentasi teknis, catatan rapat, atau referensi arsitektur dalam format **Markdown**.
5. Catatan **otomatis tersimpan** saat Anda beralih atau keluar dari fokus editor.

---

## 5. Template Tugas (Task Templates)

Untuk alur kerja berulang (seperti *Bug Report*, *Review PR*, *Deploy Mingguan*, atau *Sprint Planning*):

1. Klik tombol **Template** di dasbor atau pilih menu **Quick Add (Template)** pada Command Palette.
2. Pilih salah satu template yang tersedia.
3. Sistem akan otomatis mengisi form tugas lengkap beserta prioritas, estimasi jam, dan checklist subtask bawaan template tersebut.

---

## 6. Mode Fokus Pomodoro (Focus Timer)

TaktVibe dilengkapi fitur timer fokus ilmiah untuk meminimalisasi distraksi (*Deep Work*).

### A. Memulai Sesi Fokus
- Buka detail tugas apapun lalu klik tombol **Mulai Fokus**, atau
- Klik ikon jam timer pada header aplikasi.

### B. Mode Tampilan Timer
1. **Docked Compact Pill**:
   - Menempel di sudut bawah layar secara minimalis.
   - Menampilkan status sisa waktu, nama tugas aktif, serta tombol Cepat Jeda/Lanjut (*Play/Pause*).
   - Memungkinkan Anda tetap bekerja di dasbor tanpa terhalang modal besar.
2. **Expanded Zen Modal**:
   - Tampilan layar penuh bebas gangguan dengan lingkaran waktu progresif.
   - Pengaturan mode: **Fokus (25 Menit)**, **Istirahat Singkat (5 Menit)**, atau **Istirahat Panjang (15 Menit)**.
   - Waktu yang dihabiskan pada sesi fokus otomatis diakumulasikan ke atribut `actual_hours` pada tugas terkait.

---

## 7. TaktVibe Copilot (Asisten AI)

TaktVibe Copilot ditenagai oleh Google Gemini API untuk membantu Anda mengelola beban kerja secara cerdas.

### A. Membuka Copilot
- Klik tombol mengambang (*FAB*) **Copilot** di pojok kanan bawah, atau
- Buka dari menu Command Palette (`Ctrl+K`).

### B. Kemampuan Utama Copilot
- **Analisis Prioritas**: Tanyakan *"Tugas apa yang paling mendesak untuk saya selesaikan hari ini?"*
- **Saran Aksi Cepat**: Jika AI merekomendasikan perubahan alur kerja, tombol interaktif **Terapkan: Pindah status** akan muncul langsung di dalam chat. Cukup klik untuk mengeksekusi perubahan status tanpa keluar dari jendela AI.
- **Rekomendasi Pemecahan Masalah**: Minta bantuan Copilot untuk memecah tugas kompleks menjadi subtask teknis yang terukur.

---

## 8. Analitik & Ekspor Data (Analytics & AI Briefing)

Kunjungi halaman `/analytics` melalui link di sidebar untuk meninjau efektivitas kerja Anda.

### A. Metrik Produktivitas
- **Total Tugas**: Jumlah seluruh tugas terdaftar.
- **Selesai**: Jumlah tugas yang telah tuntas dikerjakan.
- **Aktif**: Tugas yang saat ini sedang berlangsung.
- **Terlambat (Overdue)**: Indikator tugas yang melewati tenggat.
- **Efisiensi Waktu**: Perbandingan total estimasi jam vs realisasi jam aktual yang dicatat.

### B. AI Executive Briefing
1. Klik tombol **Buat Briefing AI**.
2. Copilot akan merangkum ringkasan mingguan/harian mengenai pencapaian Anda, hambatan, serta saran produktivitas untuk sesi berikutnya.

### C. Ekspor Data
TaktVibe mendukung kedaulatan data pengguna secara penuh:
- **Ekspor CSV**: Unduh seluruh daftar tugas beserta atributnya ke file spreadsheet `.csv`.
- **Ekspor Markdown**: Buat dokumen laporan berbasis `.md` yang siap dibagikan ke tim atau disimpan ke catatan pribadi.

---

## 9. Command Palette & Pintasan Keyboard

TaktVibe dirancang untuk navigasi *keyboard-first*:

| Pintasan Keyboard | Aksi |
|-------------------|------|
| `Ctrl + K` atau `⌘ + K` | Membuka **Command Palette** |
| `c` (di luar input) | Membuat tugas baru secara cepat |
| `/` (di luar input) | Membuka pencarian instan |
| `Esc` | Menutup modal aktif / Command Palette |
| `Panah Atas / Bawah` | Bernavigasi di dalam daftar Command Palette |
| `Enter` | Menjalankan aksi yang dipilih di Command Palette |

---

## 10. Pengaturan Profil & Personalisasi Tema

### A. Beralih Tema Gelap & Terang (Dark / Light Mode)
- Klik tombol matahari/bulan (`☀️ / 🌙`) pada header aplikasi, atau
- Gunakan pintasan melalui Command Palette: ketik *"Ganti ke Mode Terang"* / *"Ganti ke Mode Gelap"*.
- Preferensi Anda tersimpan secara otomatis dan bebas kedipan (*anti-FOUC*).

### B. Edit Profil Pengguna
1. Klik avatar Anda di sudut kanan atas header, lalu pilih **Edit Profil**.
2. **Ubah Nama**: Edit nama lengkap Anda.
3. **Foto Profil**:
   - Klik **Pilih Foto Baru** untuk mengunggah avatar kustom.
   - Klik **Hapus Foto** jika ingin kembali menggunakan inisial nama.
4. **Ganti Kata Sandi**: Buka akordeon opsi ganti kata sandi untuk memperbarui kata sandi Anda.
5. Klik **Simpan Perubahan**.

---

## 11. Dukungan Progressive Web App (PWA)

TaktVibe dapat diinstal sebagai aplikasi native mandiri di perangkat komputer (Windows/macOS/Linux) maupun smartphone (Android/iOS):
1. Buka TaktVibe di browser berbasis Chromium (Google Chrome, Edge, Brave).
2. Klik tombol **Install App** yang muncul di sidebar atau ikon instalasi di *address bar* browser Anda.
3. Aplikasi akan terpasang di sistem dan dapat dibuka langsung dari Desktop / App Drawer dengan performa cepat dan kemampuan cache offline.

---

*Dokumen panduan ini diperbarui otomatis sesuai dengan versi rilis terkini TaktVibe.*
