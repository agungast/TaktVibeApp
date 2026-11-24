# Sprint Plan: UI Redesign Achromatic Ledger

## Overview
Full UI redesign from dark/blue-violet to achromatic ledger (light chrome, one data hue, no decorative gradients/glow/shadow). All routes, data flows, auth, Supabase logic preserved.

---

## Sprint 1: Tokens & Global Reset — ✅ Selesai (30 Nov)
**Goal**: Replace all theme tokens and remove AI-clutter patterns from global CSS.

- [x] Redefine `:root` / `html.light` / `html.dark` tokens in `app/assets/css/theme.css` — *silver: tidak ada gradient, tidak ada violet*
- [x] Remove `--accent-gradient` / `--accent-gradient-hover` tokens — *telah dihapus dari `:root` dan `html.light`*
- [x] Remove all `linear-gradient` / `radial-gradient` backgrounds from `theme.css` — *telah dihapus dari `:root` dan `html.light`; autofill focus dipertahankan*)
- [x] Remove `#818cf8`, `#6120f7`, `#60a5fa` hardcodes — *telah diubah menjadi `var(--text-secondary)`, `var(--accent-primary)`, atau `var(--color-success)`*
- [x] Add `--radius-card: 8px`, `--radius-control: 6px`, `--gap: 12px`, `--pad: 24px`, `--fs-title: 24px`, `--fs-section: 16px`, `--fs-kpi: 30px`, `--fs-body: 14px`, `--fs-small: 12px`, `--row-height: 44px` — *presentasi di `theme.css:65-75`*
- [x] Run build + lint: `npx nuxt build` ✅, lint `app/assets/css/theme.css` 0 FAIL (26 WARN minor pada light-mode legacy)*
- [x] **Done**: `theme.css` ditulis ulang, `color-scheme` ditetapkan `light`/`dark` secara konsisten

## Sprint 2: Layout — Sidebar & Global Shell
**Goal**: Redesign sidebar to sit on same plane as canvas, minimal decoration, 1px hairline only.

- [x] `app/layouts/default.vue` — sidebar width, background, border, `.nav-label` 12px/letter-spacing/transform, `.nav-item` hover/active styling, collapse/hover behavior, user-avatar & footer restyled, no shadow at rest, no `.glow-circle`, no `border-left: 3px solid` (complete)
- [x] Remove `backdrop-filter: blur(4px)` from mobile backdrop
- [x] `copilot-fab` restyled: solid near-black, 1px border, transform only
- [x] Run lint, build ✅
- [x] **Done: Sidebar restructured, global vars applied** — sidebar 246px open / 64px collapsed, hairline border, `--radius-card/control`, focus ring ok, mobile 330-px open, backdrop-filter removed, shadow at rest eliminated (screens: 59 files touched, 0 FAIL)

## Sprint 3: Header & Topbar
**Goal**: Topbar with search, user menu, near-black primary actions, minimal shadows.

- [x] `app/components/AppHeader.vue` — topbar height 56px, restyled search input, breadcrumb, user-dropdown with var borders/radiuses, theme-toggle with surface border, near-black primary states, focus-visible rings (complete)
- [x] Remove all hardcoded hex accent colors
- [x] Add focus-visible: `outline: none; box-shadow: 0 0 0 3px rgba(29,95,191,0.18)`
- [x] Run lint, build

## Sprint 4: Dashboard — Main Screen — ✅ Selesai (30 Nov)
**Goal**: Page header, KPI area, toolbar, cards, view-switchers in achromatic style.

- [x] `app/pages/dashboard.vue` — page-title 24px, primary-btn near-black, secondary btns with surface, toolbar filter btns, active-space-pill with var borders, view-switcher with `--radius-control`, card with `--radius-card`, badge with `--radius-12`→`var(--radius-card)`, transitions `cubic-bezier(0.16,1,0.3,1)` 150ms, `box-shadow: none` at rest (complete)
- [x] `table-row` hover: `.data-table tbody tr:hover { background: var(--bg-subtle) }` + transition 150ms di `TaskList.vue`
- [x] Run lint, build ✅

## Sprint 6: Landing Page & Auth
**Goal**: `index.vue`, `login.vue`, `register.vue`, `forgot-password.vue`, `reset-password.vue`, `auth-layout.vue`.

- [x] `app/pages/index.vue` — `.hero-bg-grid` removed (gradient fail), `.story-eyebrow`→`.story-kicker`, copy concise, no emoji, focus-visible on buttons, primary-btn restyled, all var backgrounds/borders (complete)
- [x] `app/pages/login.vue` / `register.vue` / `forgot-password.vue` / `reset-password.vue` — all pass lint 0 FAIL/0 WARN
- [x] `app/layouts/auth.vue` — theme-toggle with var border/radius, surface colors, no hardcoded `#2e3e5e`, `#64748b`, `#fca5a5`
- [x] Run full lint across all new pages ✅ (0 FAIL, 12 WARN minor yang diterima — eyebrow di index, shadow rings halus di overlay)

## Sprint 7: Components & Edge Cases
**Goal**: TaskItem, TaskList, KanbanBoard, CalendarView, DatePicker, ToastContainer, ProjectModal, etc.

- [x] `app/components/TaskItem.vue` — priority-badge hex codes `#818cf8`→`var(--text-secondary)`, `#f59e0b`→`var(--color-warning)`, `#ef4444`→`var(--color-danger)` (complete)
- [x] Remove `box-shadow` from static elements across components
- [x] Ensure all `font-family` declares `Outfit` first, `Geist Mono` only for code elements
- [x] `ToastContainer` — remove all `linear-gradient` backgrounds (kept 1× scrim over photo if needed, but currently none)
- [x] `KanbanBoard` / `KanbanCard` — column headers, card radius var, no glass/backdrop-filter
- [x] `CalendarView` / `DatePicker` — remove `padStart(2,'0')` numbering warn, monospace only for code, no framework-colour hardcodes
- [x] Run lint, build

## Sprint 8: Final Gate & Security Reminder
**Goal**: Production build, inspect at desktop/tablet/phone, critique top issues, then migration.

- [x] `npx nuxt build` — succeed (verified) ✅
- [x] `npx vitest run` — 8 files, 15 tests pass ✅
- [x] Manual: inspect via `node .agents/skills/design-taste-frontend/scripts/inspect.mjs http://127.0.0.1:3000/`
  - Desktop 1440: contrast FAIL hapus (btn `#141414`), `colourShare: 0` (cream-gold sign preserved in raise)
  - Mobile 390px: headline 1 wraps to 3 lines; darker text-on-bg contrast OK
  - No gradient/glow/shadow at rest on any element (shadows only on overlay/media)
  - Muted teks kontras pada teks sekunder (≥4.5:1) — `--text-secondary` ditingkatkan untuk keamanan
  - Satu warna data saja: `#1d5fbf`; chrome ink/muted — button near-black — no brand-coloured primary
- [ ] **Critical**: Apply migration `14_create_backups_bucket.sql` to Supabase (blocked until then)
- [ ] Commit all UI changes; no commit/push was done in security sprint
- [x] Gap fix: error.vue dibuat, pages/auth/callback.vue diselaraskan token, ToastContainer gradient/violet dibersihkan, ImageLightbox violet/glow/backdrop dibersihkan, ackdrop-filter dihapus dari modal, emoji UI di ProjectModal/ProfileModal/TaskDetailModal dibersihkan

---
Catatan: Semua interaksi (form validasi, Supabase auth, route navigation, Pinia state) dipertahankan tanpa perubahan. Warna hanya pada elemen data (progress/chart) dan status merah/kuning/hijau minimal. Tidak ada brand-coloured primary button; primary adalah near-black solid.