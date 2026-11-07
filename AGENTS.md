# Pedoman Desain & Anti-AI Slop (Frontend Craft Guidelines)

Dokumen ini berisi standar wajib dan aturan desain untuk seluruh pengembangan antarmuka (UI/UX) dan kode pada proyek ini. Tujuannya adalah memastikan setiap komponen memiliki kualitas *production-grade*, berkarakter unik, memiliki performa tinggi, dan **bebas dari pola klise AI (AI Slop/Pattern)**.

---

## 1. Tipografi & Huruf (Typography)
* 🚫 **DILARANG**: Menggunakan font generik default yang menjadi *tell* khas AI generatif (`Inter`, `Roboto`, `Geist`, `Fraunces`, `Plus Jakarta Sans`, `Space Grotesk`) tanpa arahan eksplisit.
* ✅ **WAJIB**:
  - Gunakan font yang berkarakter dan telah ditetapkan untuk proyek ini: **`Outfit`** (atau alternatif bernuansa modern seperti `Manrope`, `Satoshi`).
  - Tentukan hierarki ukuran yang jelas (maksimal 3–4 variasi ukuran dan 2–3 variasi bobot/weight).
  - Pastikan keterbacaan (*line-height* 1.4 – 1.6 untuk *body text*).

---

## 2. Palet Warna & Pencahayaan (Color & Lighting)
* 🚫 **DILARANG**:
  - Menggunakan *purple/indigo/violet glow* klise AI (misalnya `linear-gradient(135deg, #6366f1, #4f46e5)` dengan bayangan neon pendaran `box-shadow: 0 0 24px rgba(...)`).
  - Menggunakan *background glow blobs* raksasa (`.glow-circle` dengan `filter: blur(120px)`) yang tidak fungsional.
  - Teks abu-abu gelap berkontras rendah (*low contrast*) yang melanggar standar WCAG AA (contoh: `#64748b` di atas background `#090d16` / `#0f172a`).
* ✅ **WAJIB**:
  - Gunakan latar belakang gelap yang solid, terstruktur, dan tenang (`#090d16`, `#111726`).
  - Gunakan warna aksen solid yang tegas tanpa pendaran berlebih.
  - Pastikan rasio kontras teks utama minimal **4.5:1** (gunakan `#f1f5f9` untuk teks utama, `#94a3b8` atau `#cbd5e1` untuk teks sekunder/muted).

---

## 3. Struktur Komponen & Anti-Clutter (Visual Elements)
* 🚫 **DILARANG**:
  - **Side-Tab Accent Border**: Garis tebal di salah satu sisi kartu (`border-left: 3px solid #...`) sebagai penanda malas.
  - **Stacked Icon Squircle**: Kotak ikon kubus/squircle melayang yang ditumpuk secara canggung tepat di atas heading.
  - **Hairline Border with Wide Shadow**: Kartu `1px border` dengan *drop-shadow* raksasa yang tidak realistis dan *backdrop-filter blur* berlebihan di ruang hampa.
  - **Nesting Cards inside Cards**: Menumpuk kartu di dalam kartu tanpa alasan hierarki informasi.
* ✅ **WAJIB**:
  - Gunakan penanda semantik yang elegan: *subtle background tint* (misal: `rgba(245, 158, 11, 0.05)`), dot kecil, atau *badge* minimalis.
  - Susun header dan logo secara *inline*, proporsional, dan menyatu dengan judul (*brand mark* + nama).
  - Gunakan struktur elevasi alami (`box-shadow: 0 1px 3px rgba(0,0,0,0.1)` atau `0 4px 20px rgba(0,0,0,0.25)`).

---

## 4. Animasi & Gerakan (Motion & Performance)
* 🚫 **DILARANG**:
  - Menggunakan animasi pantulan/memantul berlebihan (*bounce/elastic easing* seperti `cubic-bezier(0.34, 1.56, 0.64, 1)`).
  - Menginterpolasi atau menganimasi properti *layout* (`transition: width, height, padding, margin`) yang memicu *layout thrashing* (*forced reflows*) dan membuat aplikasi terasa lambat/patah-patah.
* ✅ **WAJIB**:
  - Gunakan kurva perlambatan eksponensial yang natural dan elegan (*exponential ease-out* seperti `cubic-bezier(0.16, 1, 0.3, 1)` atau `ease-out`).
  - Animasikan hanya properti komposit GPU (*compositor properties*): `transform` dan `opacity`.
  - Durasi transisi interaksi harus responsif (150ms – 250ms).

---

## 5. Tombol & Elemen Interaktif (Interactive States)
* 🚫 **DILARANG**:
  - Tombol gradien neon melayang dengan animasi `transform: translateY(-2px)` berlebih dan bayangan menyala.
  - Elemen interaktif tanpa indikator fokus keyboard (*focus ring* yang hilang).
* ✅ **WAJIB**:
  - Tombol solid dengan kontras jelas, *border* halus, dan transisi *hover* yang tegas dan cepat.
  - *Focus ring* yang rapi dan konsisten (misalnya `box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15)`).
  - Indikator status *loading* / *disabled* yang jelas dengan `opacity: 0.5` dan `cursor: not-allowed`.

---

## 6. Copywriting & Informasi (UX Copy)
* 🚫 **DILARANG**:
  - Bahasa marketing berbunga-bunga khas AI ("Elevate your workflow with cutting-edge seamless solutions").
  - Menjelaskan hal yang sama berulang kali di subjudul.
* ✅ **WAJIB**:
  - Kalimat singkat, jelas, langsung pada tujuan (*direct action*).
  - Gunakan kata kerja aktif ("Masuk", "Tambah Tugas", "Simpan Perubahan").

---

## 7. Checklist Pemeriksaan Cepat Sebelum Menyelesaikan Fitur
Sebelum menandai pekerjaan selesai, pastikan:
- [ ] Tidak ada efek `glow-circle` atau gradien neon liar.
- [ ] Font konsisten menggunakan **`Outfit`**.
- [ ] Animasi modal/elemen menggunakan `cubic-bezier(0.16, 1, 0.3, 1)` tanpa pantulan (*bounce*).
- [ ] Tidak ada animasi pada properti `width`/`height`/`padding`.
- [ ] Tidak ada kartu dengan `border-left: 3px solid`.
- [ ] Kontras warna teks sekunder dan footer terbaca jelas (≥ 4.5:1).
