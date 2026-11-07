// ─── Model Data Utama ─────────────────────────────────────────────────────────

/**
 * Representasi satu lampiran file dari tabel `task_attachments`.
 */
export interface TaskAttachment {
  id: string
  task_id: string | number
  user_id?: string | null
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  is_private: boolean
  created_at: string
  // Virtual / helper URL fields untuk kemudahan render di UI
  url?: string
  thumbnail_url?: string
}

/**
 * Representasi file yang dipilih di form sebelum di-upload.
 */
export interface SelectedUploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  previewUrl?: string
  isPrivate: boolean
}

// ─── Enum Types ───────────────────────────────────────────────────────────────

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'

// ─── Subtask Model ────────────────────────────────────────────────────────────

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  created_at: string
}

export interface SubtaskPayload {
  title: string
  is_completed?: boolean
}

// ─── Project / Space Model (Notion-style Spaces) ─────────────────────────────

export interface Project {
  id: string
  user_id?: string
  name: string
  icon: string
  color: string
  created_at?: string
  task_count?: number
}

export interface ProjectPayload {
  name: string
  icon?: string
  color?: string
}

// ─── Main Task Model (Jira + Notion Hybrid) ───────────────────────────────────

/**
 * Representasi satu baris tugas dari tabel `tasks` di Supabase.
 */
export interface Task {
  id: string
  user_id: string
  project_id?: string | null
  title: string
  task?: string
  description_markdown?: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  due_date: string | null
  estimated_hours: number
  is_completed: boolean
  cover_image_url?: string | null
  image_url?: string | null
  position?: number
  created_at: string
  updated_at?: string
  
  // Relational Data (Optional untuk view)
  project?: Project | null
  subtasks?: Subtask[]
  task_attachments?: TaskAttachment[]
}

/**
 * Payload yang dikirim saat membuat tugas baru (INSERT) atau mengedit (UPDATE).
 */
export interface TaskPayload {
  user_id?: string
  project_id?: string | null
  title?: string
  task?: string
  description_markdown?: string
  status?: TaskStatus
  priority?: TaskPriority
  tags?: string[]
  due_date?: string | null
  estimated_hours?: number
  is_completed?: boolean
  cover_image_url?: string | null
  image_url?: string | null
  position?: number
}

// ─── Activity Log (Realtime) ──────────────────────────────────────────────────

/**
 * Tipe event yang dikirim oleh Supabase Realtime Postgres Changes.
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Satu entri log aktivitas yang ditampilkan di panel Activity Log.
 */
export interface ActivityLog {
  id: number
  type: RealtimeEventType
  task: string
  time: string
}

// ─── Cron Job Status ──────────────────────────────────────────────────────────

/**
 * Representasi status cron job yang dikembalikan oleh RPC `get_cron_status`.
 */
export interface CronStatus {
  jobid?: number
  schedule?: string
  command?: string
  nodename?: string
  nodeport?: number
  database?: string
  username?: string
  active?: boolean
  status?: string
  last_run?: string
  message?: string
}

// ─── Backup File ──────────────────────────────────────────────────────────────

/**
 * Metadata file backup yang dikembalikan oleh RPC `list_backup_files`.
 */
export interface BackupFile {
  name: string
  created_at: string
  size_bytes: number
}

// ─── Form Submit & Edit Payloads ──────────────────────────────────────────────

/**
 * Payload yang dikirim oleh komponen TaskForm saat user menekan tombol submit.
 */
export interface TaskFormSubmitPayload {
  taskText: string
  priority: TaskPriority
  status: TaskStatus
  projectId?: string | null
  dueDate?: string | null
  estimatedHours?: number
  tags?: string[]
  files: SelectedUploadFile[]
}

/**
 * Payload untuk memperbarui atribut tugas dari modal edit.
 */
export interface TaskEditPayload {
  title: string
  priority?: TaskPriority
  status?: TaskStatus
  project_id?: string | null
  due_date?: string | null
  estimated_hours?: number
  tags?: string[]
}

/**
 * Tipe item yang ditampilkan dalam Galeri Lightbox.
 */
export interface LightboxMediaItem {
  url: string
  title?: string
  fileName?: string
  isPrivate?: boolean
}
