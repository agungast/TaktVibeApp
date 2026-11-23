# Sprint Plan: UI Redesign Achromatic Ledger

## Overview
Full UI redesign from dark/blue-violet to achromatic ledger (light chrome, one data hue, no decorative gradients/glow/shadow). All routes, data flows, auth, Supabase logic preserved.

---

## Sprint 1: Tokens & Global Reset
**Goal**: Replace all theme tokens and remove AI-clutter patterns from global CSS.

- [x] Redefine `:root` / `html.light` / `html.dark` tokens in `app/assets/css/theme.css` (complete)
- [ ] Remove `--accent-gradient` / `--accent-gradient-hover` tokens
- [ ] Remove all `linear-gradient` / `radial-gradient` backgrounds from `theme.css` (kept only for darkmode autofoill — verifikasi)
- [ ] Remove `#818cf8`, `#6120f7`, `#60a5fa` hardcodes
- [ ] Add `--radius-card`, `--radius-control`, `--gap`, `--pad`, `--fs-*`, `--row-height` vars
- [ ] Run build + lint: 0 FAIL
- [ ] **Done**: 16 files updated, build passes

## Sprint 2: Layout — Sidebar & Global Shell
**Goal**: Redesign sidebar to sit on same plane as canvas, minimal decoration, 1px hairline only.

- [x] `app/layouts/default.vue` — sidebar width, background, border, `.nav-label` 12px/letter-spacing/transform, `.nav-item` hover/active styling, collapse/hover behavior, user-avatar & footer restyled, no shadow at rest, no `.glow-circle`, no `border-left: 3px solid` (complete)
- [x] Remove `backdrop-filter: blur(4px)` from mobile backdrop
- [x] `copilot-fab` restyled: solid near-black, 1px border, transform only
- [x] Run lint, build
- [ ] **Done**: Sidebar restructured, global vars applied

## Sprint 3: Header & Topbar
**Goal**: Topbar with search, user menu, near-black primary actions, minimal shadows.

- [x] `app/components/AppHeader.vue` — topbar height 56px, restyled search input, breadcrumb, user-dropdown with var borders/radiuses, theme-toggle with surface border, near-black primary states, focus-visible rings (complete)
- [x] Remove all hardcoded hex accent colors
- [x] Add focus-visible: `outline: none; box-shadow: 0 0 0 3px rgba(29,95,191,0.18)`
- [x] Run lint, build

## Sprint 4: Dashboard — Main Screen
**Goal**: Page header, KPI area, toolbar, cards, view-switchers in achromatic style.

- [x] `app/pages/dashboard.vue` — page-title 24px, primary-btn near-black, secondary btns with surface, toolbar filter btns, active-space-pill with var borders, view-switcher with `--radius-control`, card with `--radius-card`, badge with `--radius-12`→`var(--radius-card)`, transitions `cubic-bezier(0.16,1,0.3,1)` 150ms, `box-shadow: none` at rest (complete)
- [ ] `table-row` hover states with var backgrounds
- [ ] Run lint, build

## Sprint 5: Analytics & Data Pages
**Goal**: Metrics grid, priority rows, chart-ready but no data charts yet.

- [x] `app/pages/analytics.vue` — page-title 24px, primary-btn/ghost-btn restyled, metrics grid 6-col→fluid, metric-value font-variant-numeric tabular-nums, `.seg`/` .hl` pills with `--radius-999`→var, card radius var, `.row` background var, no box-shadow at rest (complete)
- [ ] Focus-visible rings on all interactive
- [ ] Run lint, build

## Sprint 6: Landing Page & Auth
**Goal**: `index.vue`, `login.vue`, `register.vue`, `forgot-password.vue`, `reset-password.vue`, `auth-layout.vue`.

- [x] `app/pages/index.vue` — `.hero-bg-grid` removed (gradient fail), `.story-eyebrow`→`.story-kicker`, copy concise, no emoji, focus-visible on buttons, primary-btn restyled, all var backgrounds/borders (complete)
- [x] `app/pages/login.vue` / `register.vue` / `forgot-password.vue` / `reset-password.vue` — all pass lint 0 FAIL/0 WARN
- [x] `app/layouts/auth.vue` — theme-toggle with var border/radius, surface colors, no hardcoded `#2e3e5e`, `#64748b`, `#fca5a5`
- [ ] Run full lint across all new pages

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

- [x] `npx nuxt build` — succeed (verified)
- [x] `npx vitest run` — 8 files, 15 tests pass
- [ ] Manual: open app at 1440px/768px/390px, verify:
  - No gradient/glow/shadow at rest on any element
  - Font: Outfit first, no Inter/Roboto/Geist unless fallback
  - Sidebar: 246px open, 64px collapsed, hairline border only
  - Topbar: 56px, search 240px, user avatar 36px, focus ring visible
  - Buttons: primary near-black `#141414`, hover slightly darker
  - Cards: `--radius-card` 8px, surface white, border `--border-color`
  - Muted text: `#5f636b` above `#f2f4f7` (4.5:1 contrast)
  - One data hue: `#1d5fbf` only on actual data elements (progress bars, chart lines), NOT on buttons/borders/labels
- [ ] **Critical**: Apply migration `14_create_backups_bucket.sql` to Supabase (blocked until then)
- [ ] Commit all UI changes; no commit/push was done in security sprint

---
Catatan: Semua interaksi (form validasi, Supabase auth, route navigation, Pinia state) dipertahankan tanpa perubahan. Warna hanya pada elemen data (progress/chart) dan status merah/kuning/hijau minimal. Tidak ada brand-coloured primary button; primary adalah near-black solid.