# Product Requirement Document (PRD)
## SoloFlow — Personal Task & Knowledge Management System

---

## 1. Document Overview
* **Product Name**: SoloFlow (Evolution of TaskFlow)
* **Version**: 1.0.0
* **Target Audience**: Solo Developers, Freelancers, Indie Hackers, Content Creators, Students
* **Tech Stack**: Nuxt 3, Vue 3 (Composition API), Pinia, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage, Realtime, pg_cron)[cite: 1]

---

## 2. Product Vision & Problem Statement

### 2.1 Vision
SoloFlow menggabungkan ketegasan pelacakan alur kerja dan prioritas ala **Jira** dengan fleksibilitas dokumentasi catatan/halaman ala **Notion**, yang dioptimalkan secara spesifik untuk **pengguna tunggal (solo user)** tanpa birokrasi kolaborasi tim.

### 2.2 Problem Statement
* **Jira** terlalu kaku dan berlebihan (*over-engineered*) untuk individu, dengan konfigurasi Scrum/Sprint/Permission tim yang tidak relevan bagi solo user.
* **Notion** sangat fleksibel namun sering terasa lambat (*bloated*), kurang optimal untuk visualisasi *time estimate*, pelacakan *deadline*, dan pembersihan data otomatis.
* Aplikasi *to-do* standar terlalu sederhana (hanya sekadar checkbox tanpa konteks detail atau manajemen proyek terstruktur).

---

## 3. User Personas & Use Cases

### User Persona: The Solo Builder / Indie Developer
* **Needs**: 
  * Mengatur *backlog* ide fitur dan *bug* dengan estimasi waktu.
  * Menulis catatan teknis/dokumentasi kaya langsung di dalam tiket tugas.
  * Melihat beban kerja mingguan (*focus cycle*) tanpa repot mengatur alur approval.
* **Pain Points**:
  * Berpindah-pindah aplikasi antara Notion (catatan) dan Jira/Trello (papan tugas).
  * Data tugas menumpuk tanpa pembersihan otomatis.

---

## 4. Functional Requirements & Feature Specifications

### 4.1 Multi-View Task Board (Jira + Notion Hybrid)
* **Table View (Default)**: Menampilkan data tabular terstruktur dengan filter pencarian instan (*live search*), sortir prioritas, indikator lampiran, dan badge status[cite: 1].
* **Kanban Board**: Tampilan kolom status (*BACKLOG*, *TODO*, *IN_PROGRESS*, *DONE*) dengan dukungan *drag-and-drop* untuk mengubah status secara intuitif.
* **Calendar / Timeline View**: Visualisasi tugas berbasis `due_date` untuk memetakan beban harian dan mingguan.

### 4.2 Rich Detail & Markdown Workspace (Notion Style)
* Setiap tugas memiliki modal/halaman detail luas yang mendukung penulisan format **Markdown** (headings, bold, lists, code block, hyperlinks).
* **Checklist / Subtasks**: Kemampuan menambahkan sub-tugas bersarang di dalam satu tugas utama dengan bilah kemajuan (*progress bar*) otomatis.

### 4.3 Issue Attributes & Metadata (Jira Style)
* **Priority Levels**: `LOW`, `MEDIUM`, `HIGH`, `URGENT` dengan badge warna kontras.
* **Task Categories / Projects**: Pengelompokan tugas ke dalam ruang kerja (*Spaces*) dengan ikon dan warna kustom.
* **Time Estimation & Story Points**: Kolom input `estimated_hours` untuk memantau durasi pengerjaan.
* **Tags & Labels**: Sistem penanda fleksibel berbentuk array string (misal: `frontend`, `bug`, `research`).

### 4.4 Media & Storage Management
* Upload lampiran berkas/screenshot langsung ke **Supabase Storage**[cite: 1].
* Preview media resolusi penuh via **Image Lightbox Modal**[cite: 1].

### 4.5 Safety UX & Realtime Feedback
* **Destructive Action Protection**: Modal konfirmasi sebelum menghapus tugas secara permanen[cite: 1].
* **Toast Notifications**: Notifikasi instan di sudut layar saat Create, Update, dan Delete berhasil.
* **Realtime Activity Log**: Panel pemantauan perubahan data database secara *real-time* via Supabase Channel[cite: 1].
* **Automated Housekeeping**: Integrasi `pg_cron` untuk mengarsipkan atau menghapus tugas berstatus `DONE` setelah durasi tertentu (misal > 30 hari)[cite: 1].

---

## 5. Database Schema Specification (Supabase PostgreSQL)

```sql
-- 1. Enum Types
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE task_status AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED');

-- 2. Projects Table (Spaces ala Notion)
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tasks Table (Jira Issue + Notion Doc Hybrid)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description_markdown TEXT DEFAULT '',
  status task_status DEFAULT 'TODO' NOT NULL,
  priority task_priority DEFAULT 'MEDIUM' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  estimated_hours NUMERIC(4, 1) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Subtasks Table (Checklist)
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo user full access to projects" ON projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Solo user full access to tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Solo user full access to subtasks" ON subtasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );