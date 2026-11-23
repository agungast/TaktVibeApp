# Arah desain baru TaktVibe

## Keputusan

Menggunakan arah **Achromatic ledger** dari taste-skill (app screen, kind `workspace`), bukan identitas gelap/blue-violet sebelumnya.

Alasan: TaktVibe dipakai untuk sesi kerja harian panjang. Arah ini menjaga chrome tanpa warna, satu warna data saja, densitas baris 44px, dan tidak ada dekorasi yang bersaing dengan tugas. Cocok untuk Kanban, kalender, dan daftar tugas.

## Face

- Permukaan: blue-grey `#f2f4f7` (dari dunia "ledger/meter"), kartu tetap putih.
- Satu warna data: `#1d5fbf`, hanya untuk elemen data utama (mis. progres hari ini / grafik utama). Chrome tetap hitam/abu.
- Nominal dan angka memakai `font-variant-numeric: tabular-nums`.

Font Geist dari sheet tidak dipakai karena AGENTS.md proyek mewajibkan Outfit (atau alternatif sederhana sejenis). Pengecualian ini dicatat; hierarki ukuran sheet tetap diikuti.

## Token inti

| Peran | Nilai terang |
|---|---|
| ground | `#f2f4f7` |
| surface | `#ffffff` |
| border | `#e2e5e9` |
| rule | `#eceff2` |
| text | `#111316` |
| muted | `#5f636b` |
| accent / primary action | `#141414` |
| chart | `#1d5fbf` |
| radius card / control | `8px` / `6px` |
| row height | `44px` |
| gap | `12px` |
| pad | `24px` |

## Aturan

- Tidak ada gradien, glow, glass, shadow pada elemen diam.
- Satu primary action per layar: solid near-black. Secondary: outline/netral.
- Status memakai pill netral + dot; warna hanya pada sinyal kecil (overdue/fail/success).
- Sidebar terbuka pada ground yang sama dengan canvas, dipisahkan satu hairline.
- Tidak ada topbar pada workspace; judul halaman langsung di canvas. Header global disederhanakan menjadi search + user + toggle.
- Radius konsisten 8px/6px;过渡 hanya `transform`/`opacity`, 150–250ms, `cubic-bezier(0.16, 1, 0.3, 1)`.
- Teks sekunder minimal kontras 4.5:1.

## Ruang lingkup

Prioritas: shell (`layouts/default.vue`, `AppHeader.vue`), `dashboard.vue`, `analytics.vue`, `index.vue`, auth pages, `theme.css`, dan komponen tugas inti. Route, store, Supabase, auth, dan semua interaksi tetap dipertahankan.
