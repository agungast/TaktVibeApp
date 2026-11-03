import { defineStore } from 'pinia'
import { useToastStore } from '~/stores/toastStore'
import type {
  Task,
  TaskPayload,
  TaskPriority,
  TaskStatus,
  Subtask,
  Project,
  ProjectPayload,
  TaskAttachment,
  SelectedUploadFile,
  TaskFormSubmitPayload,
  TaskEditPayload,
  LightboxMediaItem,
  TaskTemplate,
  ProjectNote,
  ProjectNotePayload
} from '~/types/task'

export const useTaskStore = defineStore('task', () => {
  // ─── Supabase Client & User ──────────────────────────────────────────────────
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const toast = {
    error: (msg: string, title?: string) => useToastStore().error(msg, title),
    success: (msg: string, title?: string) => useToastStore().success(msg, title),
    info: (msg: string, title?: string) => useToastStore().addToast({ message: msg, type: 'info', title })
  }

  // ─── Storage Buckets ──────────────────────────────────────────────────────────
  //
  // Kenapa dua bucket? Bucket yang ditandai `public = true` di Supabase dapat
  // dibaca ANONIM tanpa melewati RLS sama sekali. Menaruh folder `public/` dan
  // `private/` di bucket yang sama berarti file privat ikut terbuka — policy RLS
  // yang seketat apa pun tidak akan menutupnya. Jadi dipisah:
  //
  //   project-crud          -> public   : cover tugas & avatar (URL absolut
  //                                       disimpan permanen di database)
  //   project-crud-private  -> private  : lampiran privat, hanya Signed URL
  const PUBLIC_BUCKET = 'project-crud'
  const PRIVATE_BUCKET = 'project-crud-private'
  const SIGNED_URL_TTL_SECONDS = 60 * 60

  /** Normalisasi storage key: buang slash di depan. */
  function normalizeStoragePath(filePathOrUrl: string): string {
    return (filePathOrUrl || '').replace(/^\/+/, '')
  }

  /** True bila key ini berada di folder privat. */
  function isPrivatePath(filePathOrUrl: string): boolean {
    return normalizeStoragePath(filePathOrUrl).startsWith('private/')
  }

  /** Pilih bucket berdasarkan prefix folder. */
  function resolveBucket(filePathOrUrl: string): string {
    return isPrivatePath(filePathOrUrl) ? PRIVATE_BUCKET : PUBLIC_BUCKET
  }

  /**
   * Cache Signed URL untuk file privat. `getThumbnailUrl` bersifat sinkron
   * (dipakai langsung di binding `:src`), jadi Signed URL tidak bisa di-await
   * di sana. Pola yang dipakai: ambil dari cache; bila belum ada, picu pembuatan
   * di latar belakang — karena cache bersifat reaktif, komponen otomatis
   * me-render ulang begitu URL tersedia.
   */
  const signedUrlCache = ref<Record<string, string>>({})
  const pendingSignedUrls = new Set<string>()

  async function ensureSignedUrl(filePath: string): Promise<string | null> {
    const path = normalizeStoragePath(filePath)
    if (!path) return null

    const cached = signedUrlCache.value[path]
    if (cached) return cached

    if (pendingSignedUrls.has(path)) return null
    pendingSignedUrls.add(path)

    try {
      const { data, error } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

      if (error) {
        console.error('Error creating signed URL:', error.message)
        return null
      }
      if (data?.signedUrl) {
        signedUrlCache.value = { ...signedUrlCache.value, [path]: data.signedUrl }
        return data.signedUrl
      }
      return null
    } finally {
      pendingSignedUrls.delete(path)
    }
  }

  // ─── State ────────────────────────────────────────────────────────────────────
  const tasks = ref<Task[]>([])
  const pending = ref<boolean>(false)
  const uploading = ref<boolean>(false)

  // Action Menu (TaskItem dropdown exclusivity)
  const activeMenuTaskId = ref<string | number | null>(null)

  // Task Templates (Sprint 3 — AI Natural Language Quick Add & Templates)
  const templates = ref<TaskTemplate[]>([])
  const showTemplateModal = ref<boolean>(false)

  // Project Notes / Wiki (Sprint 4)
  const projectNotes = ref<ProjectNote[]>([])
  const projectNotesLoading = ref<boolean>(false)
  const showProjectNotesModal = ref<boolean>(false)
  const selectedProjectForNotes = ref<Project | null>(null)

  function openTemplateModal(): void {
    showTemplateModal.value = true
  }

  function closeTemplateModal(): void {
    showTemplateModal.value = false
  }

  // Sidebar
  const sidebarCollapsed = ref<boolean>(false)

  // Project Spaces (SoloFlow Phase 4: Notion-style Spaces)
  const projects = ref<Project[]>([])
  const activeProjectId = ref<string | null>(null)
  const showProjectModal = ref<boolean>(false)
  const selectedProjectForEdit = ref<Project | null>(null)
  const projectsLoading = ref<boolean>(false)

  // Lightbox (Mendukung Galeri Multi-Gambar)
  const lightboxItems = ref<LightboxMediaItem[]>([])
  const lightboxIndex = ref<number>(0)
  const lightboxImage = computed<string | null>(() => {
    if (lightboxItems.value.length === 0) return null
    return lightboxItems.value[lightboxIndex.value]?.url ?? null
  })

  // Attachment Modal
  const selectedTaskForAttachments = ref<Task | null>(null)
  const showAttachmentModal = ref<boolean>(false)

  // Task Detail Modal (SoloFlow Phase 3: Notion Workspace & Subtasks)
  const selectedTaskForDetail = ref<Task | null>(null)
  const showDetailModal = ref<boolean>(false)
  const detailLoading = ref<boolean>(false)

  // View Mode ('table' | 'kanban' | 'calendar')
  const viewMode = ref<'table' | 'kanban' | 'calendar'>('table')

  // Search Filter Query
  const searchQuery = ref<string>('')

  // Inisialisasi preferensi view mode dari localStorage di sisi client
  if (import.meta.client) {
    const savedView = localStorage.getItem('soloflow_view_mode')
    if (savedView === 'table' || savedView === 'kanban' || savedView === 'calendar') {
      viewMode.value = savedView
    }
  }

  function setViewMode(mode: 'table' | 'kanban' | 'calendar'): void {
    viewMode.value = mode
    if (import.meta.client) {
      localStorage.setItem('soloflow_view_mode', mode)
    }
  }

  // Helper parsing tags agar selalu berupa string[]
  function parseTags(rawTags: any): string[] {
    if (!rawTags) return []
    if (Array.isArray(rawTags)) return rawTags.map(t => String(t).trim()).filter(Boolean)
    if (typeof rawTags === 'string') {
      return rawTags
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map(t => t.replace(/["']/g, '').trim())
        .filter(Boolean)
    }
    return []
  }

  // ─── Getters (Computed) ───────────────────────────────────────────────────────
  const activeProject = computed<Project | null>(() => {
    if (!activeProjectId.value) return null
    return projects.value.find(p => String(p.id) === String(activeProjectId.value)) || null
  })

  const filteredTasks = computed<Task[]>(() => {
    let list = Array.isArray(tasks.value) ? tasks.value : []

    // Filter berdasarkan Project Space aktif jika dipilih
    if (activeProjectId.value) {
      list = list.filter((t: Task) => String(t.project_id) === String(activeProjectId.value))
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((t: Task) => {
      if (!t) return false
      const name = (t.title || '').toLowerCase()
      const matchesName = name.includes(q)
      const matchesPriority = (t.priority || '').toLowerCase().includes(q)
      const matchesStatus = (t.status || '').toLowerCase().includes(q)
      const tagsArray = parseTags(t.tags)
      const matchesTags = tagsArray.some(tag => tag.toLowerCase().includes(q))
      const projectName = t.project?.name?.toLowerCase() || ''
      const matchesProject = projectName.includes(q)
      return matchesName || matchesPriority || matchesStatus || matchesTags || matchesProject
    })
  })

  const tasksByStatus = computed<Record<TaskStatus, Task[]>>(() => {
    const groups: Record<TaskStatus, Task[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      ARCHIVED: []
    }
    const list = Array.isArray(filteredTasks.value) ? filteredTasks.value : []
    list.forEach(task => {
      if (!task) return
      const s = task.status || 'TODO'
      if (groups[s]) {
        groups[s].push(task)
      } else {
        groups.TODO.push(task)
      }
    })
    return groups
  })

  const completedCount = computed<number>(() =>
    tasks.value.filter((t: Task) => t.status === 'DONE').length
  )

  const activeCount = computed<number>(() =>
    tasks.value.filter((t: Task) => t.status !== 'DONE' && t.status !== 'ARCHIVED').length
  )

  const progressPercent = computed<number>(() => {
    if (tasks.value.length === 0) return 0
    return Math.round((completedCount.value / tasks.value.length) * 100)
  })

  // ─── READ (Initial Fetch with Attachments & Subtasks) ─────────────────────────
  async function fetchTasks(): Promise<void> {
    pending.value = true
    try {
      let currentUserId = user.value?.id
      if (!currentUserId && import.meta.client) {
        try {
          const { data: userData } = await supabase.auth.getUser()
          currentUserId = userData?.user?.id
        } catch {}
      }

      let query: any = supabase
        .from('todos')
        .select('*, task_attachments(*), subtasks(*)')
        .order('created_at', { ascending: false })

      if (currentUserId) {
        query = query.eq('user_id', currentUserId)
      }

      let { data, error } = await query

      // Resilient fallback jika tabel subtasks belum dimigrasi di remote Supabase
      if (error && (error.message?.includes('subtasks') || error.code === 'PGRST204' || error.message?.includes('relation'))) {
        console.warn('Tabel subtasks belum dibuat di Supabase remote. Mengambil data tugas tanpa relasi subtasks.')
        let fallbackQuery: any = supabase
          .from('todos')
          .select('*, task_attachments(*)')
          .order('created_at', { ascending: false })
        if (currentUserId) {
          fallbackQuery = fallbackQuery.eq('user_id', currentUserId)
        }
        const fallback = await fallbackQuery
        data = fallback.data
        error = fallback.error
      }

      if (error) {
        console.error('Error fetching tasks:', error)
      } else {
        tasks.value = (data ?? []).map((t: any) => {
          const rawAtts: TaskAttachment[] = t.task_attachments ?? []
          const seen = new Set<string | number>()
          const uniqueAtts = rawAtts.filter(a => {
            if (seen.has(a.id)) return false
            seen.add(a.id)
            return true
          })
          const rawSubtasks: Subtask[] = (t.subtasks ?? []).sort(
            (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          const taskName = t.title || ''
          return {
            ...t,
            title: taskName,
            priority: t.priority || 'MEDIUM',
            status: t.status || (t.is_completed ? 'DONE' : 'TODO'),
            tags: parseTags(t.tags),
            due_date: t.due_date || null,
            estimated_hours: Number(t.estimated_hours || 0),
            actual_hours: Number(t.actual_hours || 0),
            description_markdown: t.description_markdown || '',
            cover_image_url: t.cover_image_url || t.image_url || null,
            project_id: t.project_id || null,
            project: projects.value.find(p => String(p.id) === String(t.project_id)) || null,
            task_attachments: uniqueAtts,
            subtasks: rawSubtasks
          }
        }) as Task[]
      }
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err)
    } finally {
      pending.value = false
    }
  }

  // ─── STORAGE V2 HELPERS ───────────────────────────────────────────────────────

  /** Ambil dari cache Signed URL, atau picu pembuatan bila belum ada. */
  function getCachedSignedUrl(filePath: string): string {
    const path = normalizeStoragePath(filePath)
    if (!path) return ''
    const cached = signedUrlCache.value[path]
    if (cached) return cached
    void ensureSignedUrl(path)
    return ''
  }

  /**
   * Menghapus sekumpulan object dari storage, dikelompokkan per bucket.
   * Path privat dan publik berada di bucket berbeda, jadi pemanggilan
   * `remove()` tunggal akan selalu gagal untuk salah satunya.
   */
  async function removeStoragePaths(filePaths: string[]): Promise<void> {
    const byBucket = new Map<string, string[]>()
    for (const rawPath of filePaths) {
      const path = normalizeStoragePath(rawPath)
      if (!path) continue
      const bucket = resolveBucket(path)
      const list = byBucket.get(bucket) ?? []
      list.push(path)
      byBucket.set(bucket, list)
    }

    await Promise.allSettled(
      [...byBucket.entries()].map(([bucket, paths]) =>
        supabase.storage.from(bucket).remove(paths)
      )
    )
  }

  /**
   * Supabase Image Transformation:
   * Mengembalikan URL thumbnail yang ringan dan cepat (default 120x120 px).
   */
  function getThumbnailUrl(filePathOrUrl: string, width = 120, height = 120): string {
    if (!filePathOrUrl) return ''

    // Jika sudah merupakan URL penuh
    if (filePathOrUrl.startsWith('http')) {
      if (filePathOrUrl.includes('/storage/v1/object/public/')) {
        return filePathOrUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${width}&height=${height}&resize=cover&quality=80`
      }
      return filePathOrUrl
    }

    // Jika berupa file_path (misal: "public/1234_abc.jpg")
    const path = normalizeStoragePath(filePathOrUrl)

    // File privat tidak punya URL stabil — harus lewat Signed URL. Ambil dari
    // cache sinkron; kalau belum ada, picu pembuatan di latar belakang.
    if (isPrivatePath(path)) {
      const cached = signedUrlCache.value[path]
      if (cached) return cached
      void ensureSignedUrl(path)
      return ''
    }

    const { data } = supabase.storage
      .from(PUBLIC_BUCKET)
      .getPublicUrl(path, {
        transform: {
          width,
          height,
          resize: 'cover',
          quality: 80
        }
      })

    return data.publicUrl
  }

  /**
   * Mengembalikan URL asli/penuh untuk file publik.
   */
  function getPublicOriginalUrl(filePath: string): string {
    if (!filePath) return ''
    if (filePath.startsWith('http')) return filePath
    const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(normalizeStoragePath(filePath))
    return data.publicUrl
  }

  /**
   * Supabase Storage Signed URLs:
   * Menghasilkan URL bertanda tangan yang kedaluwarsa untuk file privat.
   * WAJIB memakai bucket privat — Signed URL untuk bucket publik tidak menambah
   * keamanan apa pun.
   */
  async function createSignedDownloadUrl(filePath: string, expiresIn = 60): Promise<string | null> {
    const path = normalizeStoragePath(filePath)
    if (!path) return null
    try {
      const { data, error } = await supabase.storage
        .from(resolveBucket(path))
        .createSignedUrl(path, expiresIn)

      if (error) {
        console.error('Error creating signed URL:', error.message)
        return null
      }
      return data.signedUrl
    } catch (err) {
      console.error('Signed URL exception:', err)
      return null
    }
  }

  /**
   * Mengunduh atau membuka lampiran (otomatis generate signed URL jika privat).
   */
  async function downloadAttachment(attachment: TaskAttachment): Promise<void> {
    try {
      let downloadUrl: string | null = null

      if (attachment.is_private) {
        downloadUrl = await createSignedDownloadUrl(attachment.file_path, 120)
        if (!downloadUrl) {
          toast.error('Gagal membuat tautan unduh privat (Signed URL). Pastikan Anda memiliki izin akses.')
          return
        }
      } else {
        downloadUrl = getPublicOriginalUrl(attachment.file_path)
      }

      // Buka tab baru / download
      window.open(downloadUrl, '_blank')
    } catch (err: any) {
      toast.error('Gagal mengunduh file: ' + err.message)
    }
  }

  /**
   * Upload single file ke bucket yang sesuai: `project-crud` (publik) atau
   * `project-crud-private` (privat).
   *
   * PENTING: userId wajib disisipkan sebagai segmen path ke-2
   * (`public/{userId}/{file}` / `private/{userId}/{file}`) karena
   * `storage.objects` tidak punya kolom user_id. RLS pada bucket privat hanya
   * bisa memverifikasi kepemilikan lewat prefix path ini.
   * Rows legacy (tanpa userId di path) tetap terbaca karena policy SELECT
   * publik pada bucket publik hanya memeriksa folder pertama (`public`).
   */
  async function uploadSingleFile(
    fileItem: SelectedUploadFile,
    userId: string | null
  ): Promise<{ fileName: string; filePath: string; fileType: string; fileSize: number; isPrivate: boolean; publicUrl?: string } | null> {
    const file = fileItem.file
    const fileExt = file.name.split('.').pop() || 'bin'
    const randomName = Math.random().toString(36).substring(2, 10)
    const folder = fileItem.isPrivate ? 'private' : 'public'
    const ownerSegment = userId || 'unassigned'
    const fileName = `${Date.now()}_${randomName}.${fileExt}`
    const filePath = `${folder}/${ownerSegment}/${fileName}`

    const { error } = await supabase.storage
      .from(resolveBucket(filePath))
      .upload(filePath, file, {
        cacheControl: fileItem.isPrivate ? 'no-cache' : '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file to storage:', error)
      throw error
    }

    let publicUrl: string | undefined
    if (!fileItem.isPrivate) {
      publicUrl = getPublicOriginalUrl(filePath)
    }

    return {
      fileName: file.name,
      filePath,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      isPrivate: fileItem.isPrivate,
      publicUrl
    }
  }

  // ─── CREATE (Task + Multiple Attachments) ─────────────────────────────────────
  /**
   * Menambahkan tugas baru.
   *
   * Mengembalikan `true` HANYA jika task berhasil tersimpan di database.
   * Caller WAJIB memeriksa nilai balik ini sebelum mereset form — kalau tidak,
   * input user akan hilang setiap kali insert gagal (regresi data).
   */
  async function addTask(
    payloadOrText: TaskFormSubmitPayload | string,
    filesOrUndefined: SelectedUploadFile[] = []
  ): Promise<boolean> {
    uploading.value = true

    try {
      const isObject = typeof payloadOrText === 'object'
      const taskText = isObject ? payloadOrText.taskText : payloadOrText
      const files = isObject ? payloadOrText.files : filesOrUndefined
      const priority: TaskPriority = isObject ? (payloadOrText.priority ?? 'MEDIUM') : 'MEDIUM'
      const status: TaskStatus = isObject ? (payloadOrText.status ?? 'TODO') : 'TODO'
      const projectId: string | null = isObject ? (payloadOrText.projectId ?? null) : null
      const dueDate: string | null = isObject ? (payloadOrText.dueDate ?? null) : null
      const tags: string[] = isObject ? (payloadOrText.tags ?? []) : []
      const estimatedHours: number = isObject && payloadOrText.estimatedHours ? Number(payloadOrText.estimatedHours) : 0
      const actualHours: number = isObject && payloadOrText.actualHours ? Number(payloadOrText.actualHours) : 0

      // 1. Dapatkan user_id sesi aktif
      let currentUserId = user.value?.id
      if (!currentUserId) {
        const { data: userData } = await supabase.auth.getUser()
        currentUserId = userData?.user?.id
      }

      // 2. Upload semua file ke storage terlebih dahulu
      const uploadedResults = []
      let primaryImageUrl: string | null = null

      for (const f of files) {
        const uploaded = await uploadSingleFile(f, currentUserId ?? null)
        if (uploaded) {
          uploadedResults.push(uploaded)
          // Set primary image jika berupa gambar publik pertama
          if (!primaryImageUrl && !uploaded.isPrivate && uploaded.fileType.startsWith('image/')) {
            primaryImageUrl = uploaded.publicUrl ?? null
          }
        }
      }

      // 3. Simpan tugas ke tabel `todos`
      const payload: any = {
        title: taskText,
        priority,
        status,
        project_id: projectId || null,
        due_date: dueDate,
        estimated_hours: estimatedHours,
        actual_hours: actualHours,
        tags
      }

      if (primaryImageUrl) {
        payload.cover_image_url = primaryImageUrl
      }

      if (currentUserId) {
        payload.user_id = currentUserId
      }

      let { data: taskData, error: taskError } = await (supabase
        .from('todos') as any)
        .insert([payload])
        .select()
        .single()

      // Resilient fallback jika kolom alur kerja SoloFlow (priority, status, dll.) belum dieksekusi di database
      if (taskError && (taskError.message?.includes('column') || taskError.code === 'PGRST204' || taskError.message?.includes('schema cache'))) {
        console.warn('Kolom alur kerja SoloFlow belum ada di database Supabase. Menggunakan fallback:', taskError.message)
        const minimalPayload: any = {
          task: taskText,
          is_completed: status === 'DONE'
        }
        if (primaryImageUrl) minimalPayload.image_url = primaryImageUrl
        if (currentUserId) minimalPayload.user_id = currentUserId

        const fallbackResult = await (supabase.from('todos') as any)
          .insert([minimalPayload])
          .select()
          .single()

        taskData = fallbackResult.data
        taskError = fallbackResult.error
      }

      if (taskError) {
        console.error('Error inserting task:', taskError)
        toast.error('Gagal menambahkan tugas: ' + taskError.message)
        // Bersihkan file yang sudah terupload sebelum insert gagal, agar tidak
        // menumpuk sebagai file yatim di Storage.
        if (uploadedResults.length > 0) {
          void removeStoragePaths(uploadedResults.map(r => r.filePath))
        }
        return false
      }

      const taskTitle = taskData.title || taskData.task || taskText
      const finalProjectId = taskData.project_id || projectId || null
      const newTask = {
        ...taskData,
        title: taskTitle,
        priority: priority || taskData.priority,
        status: taskData.status || status,
        project_id: finalProjectId,
        project: projects.value.find(p => String(p.id) === String(finalProjectId)) || null,
        due_date: taskData.due_date || dueDate,
        tags: taskData.tags || tags,
        cover_image_url: taskData.cover_image_url || taskData.image_url || primaryImageUrl
      } as Task
      newTask.task_attachments = []

      // 4. Simpan relasi lampiran ke tabel `task_attachments`
      if (uploadedResults.length > 0) {
        const attachmentsPayload = uploadedResults.map(r => ({
          task_id: newTask.id,
          user_id: currentUserId,
          file_name: r.fileName,
          file_path: r.filePath,
          file_type: r.fileType,
          file_size: r.fileSize,
          is_private: r.isPrivate
        }))

        const { data: attData, error: attError } = await (supabase
          .from('task_attachments') as any)
          .insert(attachmentsPayload)
          .select()

        if (!attError && attData) {
          newTask.task_attachments = attData as TaskAttachment[]
        } else if (attError) {
          console.warn('Gagal menyimpan lampiran metadata:', attError.message)
        }
      }

      // 5. Update state lokal secara instan
      if (!tasks.value.some(t => t.id === newTask.id)) {
        tasks.value.unshift(newTask)
      }
      toast.success('Tugas baru berhasil ditambahkan!')
      return true
    } catch (err: any) {
      console.error('Unexpected error adding task:', err)
      toast.error('Terjadi kesalahan saat menambahkan tugas: ' + (err.message || err))
      return false
    } finally {
      uploading.value = false
    }
  }

  // ─── ADD ATTACHMENTS TO EXISTING TASK ─────────────────────────────────────────
  async function addAttachmentsToTask(taskId: string | number, files: SelectedUploadFile[]): Promise<boolean> {
    if (files.length === 0) return true
    uploading.value = true

    try {
      let currentUserId = user.value?.id
      if (!currentUserId) {
        const { data: userData } = await supabase.auth.getUser()
        currentUserId = userData?.user?.id
      }

      const uploadedResults = []
      for (const f of files) {
        const uploaded = await uploadSingleFile(f, currentUserId ?? null)
        if (uploaded) uploadedResults.push(uploaded)
      }

      const attachmentsPayload = uploadedResults.map(r => ({
        task_id: taskId,
        user_id: currentUserId,
        file_name: r.fileName,
        file_path: r.filePath,
        file_type: r.fileType,
        file_size: r.fileSize,
        is_private: r.isPrivate
      }))

      const { data: attData, error: attError } = await (supabase
        .from('task_attachments') as any)
        .insert(attachmentsPayload)
        .select()

      if (attError) {
        toast.error('Gagal menambahkan lampiran: ' + attError.message)
        return false
      }

      // Update state lokal secara aman (deduplikasi ID & shared reference fix)
      const insertedAttachments = (attData as TaskAttachment[]) || []
      const targetIdx = tasks.value.findIndex(t => t.id === taskId)
      if (targetIdx !== -1 && tasks.value[targetIdx]) {
        const existing = tasks.value[targetIdx].task_attachments || []
        const existingIds = new Set(existing.map(a => a.id))
        const uniqueNew = insertedAttachments.filter(a => !existingIds.has(a.id))
        tasks.value[targetIdx].task_attachments = [...existing, ...uniqueNew]

        if (selectedTaskForAttachments.value && selectedTaskForAttachments.value.id === taskId) {
          selectedTaskForAttachments.value.task_attachments = tasks.value[targetIdx].task_attachments
        }
      } else if (selectedTaskForAttachments.value && selectedTaskForAttachments.value.id === taskId) {
        const existing = selectedTaskForAttachments.value.task_attachments || []
        const existingIds = new Set(existing.map(a => a.id))
        const uniqueNew = insertedAttachments.filter(a => !existingIds.has(a.id))
        selectedTaskForAttachments.value.task_attachments = [...existing, ...uniqueNew]
      }

      // Tambahkan ke Activity Log
      const targetTask = tasks.value.find(t => t.id === taskId)
      const taskName = targetTask?.title || 'Tugas'
      toast.success(`Berhasil menambahkan ${files.length} lampiran!`)

      return true
    } catch (err: any) {
      toast.error('Gagal mengunggah lampiran: ' + err.message)
      return false
    } finally {
      uploading.value = false
    }
  }

  // ─── DELETE ATTACHMENT ────────────────────────────────────────────────────────
  async function deleteAttachment(attachment: TaskAttachment): Promise<void> {
    try {
      // 1. Hapus dari database task_attachments
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) {
        toast.error('Gagal menghapus lampiran dari database: ' + dbError.message)
        return
      }

      // 2. Hapus file dari Storage bucket
      await supabase.storage
        .from('project-crud')
        .remove([attachment.file_path])

      // 3. Update state lokal
      const targetIdx = tasks.value.findIndex(t => t.id === attachment.task_id)
      let taskName = 'Tugas'
      if (targetIdx !== -1 && tasks.value[targetIdx]?.task_attachments) {
        taskName = tasks.value[targetIdx].title
        tasks.value[targetIdx].task_attachments = tasks.value[targetIdx].task_attachments!.filter(
          a => a.id !== attachment.id
        )
      }

      if (selectedTaskForAttachments.value && selectedTaskForAttachments.value.id === attachment.task_id) {
        if (targetIdx !== -1 && tasks.value[targetIdx]?.task_attachments) {
          selectedTaskForAttachments.value.task_attachments = tasks.value[targetIdx].task_attachments
        } else if (selectedTaskForAttachments.value.task_attachments) {
          selectedTaskForAttachments.value.task_attachments = selectedTaskForAttachments.value.task_attachments.filter(
            a => a.id !== attachment.id
          )
        }
      }

      // Tambahkan ke Activity Log
      toast.success(`Lampiran '${attachment.file_name}' berhasil dihapus!`)
    } catch (err: any) {
      console.error('Error deleting attachment:', err)
      toast.error('Terjadi kesalahan saat menghapus lampiran: ' + err.message)
    }
  }

  // ─── UPDATE (toggle status) ───────────────────────────────────────────────────
  async function toggleTask(task: Task): Promise<void> {
    const previousStatus = task.status
    const newStatus: TaskStatus = previousStatus === 'DONE' ? 'TODO' : 'DONE'
    const targetIdx = tasks.value.findIndex(t => t.id === task.id)
    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      tasks.value[targetIdx].status = newStatus
    }

    const { error } = await (supabase
      .from('todos') as any)
      .update({ status: newStatus })
      .eq('id', task.id)

    if (error) {
      console.error('Error toggling task:', error)
      toast.error('Gagal memperbarui status tugas')
      if (targetIdx !== -1 && tasks.value[targetIdx]) {
        tasks.value[targetIdx].status = previousStatus
      }
    } else {
      if (newStatus === 'DONE') {
        toast.success(`Tugas '${task.title}' selesai! 🎉`)
      } else {
        toast.info(`Status '${task.title}' diubah ke Belum Selesai`)
      }
    }
  }

  // ─── UPDATE (update status langsung) ───────────────────────────────────────────
  async function updateTaskStatus(task: Task, newStatus: TaskStatus): Promise<void> {
    const oldStatus = task.status
    const targetIdx = tasks.value.findIndex(t => t.id === task.id)
    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      tasks.value[targetIdx].status = newStatus
    }

    let { error } = await (supabase
      .from('todos') as any)
      .update({ status: newStatus, is_completed: newStatus === 'DONE' })
      .eq('id', task.id)

    if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
      console.warn('Kolom status belum ada di database Supabase. Menggunakan fallback status penyelesaian.')
      const fallback = await (supabase.from('todos') as any)
        .update({ is_completed: newStatus === 'DONE' })
        .eq('id', task.id)
      error = fallback.error
    }

    if (error) {
      console.error('Error updating status:', error)
      toast.error('Gagal memperbarui status tugas')
      if (targetIdx !== -1 && tasks.value[targetIdx]) {
        tasks.value[targetIdx].status = oldStatus
      }
    } else {
      toast.info(`Status '${task.title}' diubah ke ${newStatus}`)
    }
  }

  // ─── UPDATE (edit atribut tugas) ──────────────────────────────────────────────
  async function editTask(
    task: Task,
    payload: string | TaskEditPayload
  ): Promise<void> {
    const targetIdx = tasks.value.findIndex(t => t.id === task.id)
    const oldTask = { ...task }
    const editData: TaskEditPayload = typeof payload === 'string' ? { title: payload } : payload
    const newTitle = editData.title.trim()
    const newStatus = editData.status ?? task.status

    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      tasks.value[targetIdx].title = newTitle
      if (editData.priority) tasks.value[targetIdx].priority = editData.priority
      if (editData.status) {
        tasks.value[targetIdx].status = editData.status
      }
      if (editData.due_date !== undefined) tasks.value[targetIdx].due_date = editData.due_date
      if (editData.tags !== undefined) tasks.value[targetIdx].tags = editData.tags
      if (editData.project_id !== undefined) {
        tasks.value[targetIdx].project_id = editData.project_id
        tasks.value[targetIdx].project = editData.project_id ? (projects.value.find(p => String(p.id) === String(editData.project_id)) || null) : null
      }
    }

    const updatePayload: any = {
      title: newTitle,
      ...(editData.priority ? { priority: editData.priority } : {}),
      ...(editData.status ? { status: editData.status } : {}),
      ...(editData.project_id !== undefined ? { project_id: editData.project_id } : {}),
      ...(editData.due_date !== undefined ? { due_date: editData.due_date } : {}),
      ...(editData.tags !== undefined ? { tags: editData.tags } : {}),
      ...(editData.estimated_hours !== undefined ? { estimated_hours: editData.estimated_hours } : {}),
      ...(editData.actual_hours !== undefined ? { actual_hours: editData.actual_hours } : {})
    }

    let { error } = await (supabase
      .from('todos') as any)
      .update(updatePayload)
      .eq('id', task.id)

    if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
      console.warn('Kolom atribut SoloFlow belum ada di database Supabase. Menggunakan fallback pembaruan kolom task bawaan.')
      const fallback = await (supabase.from('todos') as any)
        .update({ task: newTitle, is_completed: newStatus === 'DONE' })
        .eq('id', task.id)
      error = fallback.error
    }

    if (error) {
      console.error('Error editing task:', error)
      toast.error('Gagal mengubah tugas: ' + error.message)
      if (targetIdx !== -1 && tasks.value[targetIdx]) {
        Object.assign(tasks.value[targetIdx], oldTask)
      }
    } else {
      toast.success('Perubahan tugas berhasil disimpan!')
    }
  }

  // ─── LOG FOCUS TIME (POMODORO / ACTUAL HOURS) ──────────────────────────────────
  async function logFocusTime(taskId: string, minutesSpent: number): Promise<void> {
    const targetIdx = tasks.value.findIndex(t => String(t.id) === String(taskId))
    if (targetIdx === -1 || !tasks.value[targetIdx]) return

    const hoursToAdd = Math.round((minutesSpent / 60) * 10) / 10
    const currentActual = Number(tasks.value[targetIdx].actual_hours || 0)
    const newActual = Math.round((currentActual + hoursToAdd) * 10) / 10

    // Update state lokal
    tasks.value[targetIdx].actual_hours = newActual

    try {
      const { error } = await (supabase
        .from('todos') as any)
        .update({ actual_hours: newActual })
        .eq('id', taskId)

      if (error) {
        console.warn('Gagal menyimpan actual_hours ke Supabase:', error.message)
      } else {
        toast.success(`Waktu fokus ${minutesSpent} menit (+${hoursToAdd} jam) berhasil dicatat ke tugas!`)
      }
    } catch (err: any) {
      console.warn('Error saat update actual_hours:', err)
    }
  }

  // ─── DELETE TASK ──────────────────────────────────────────────────────────────
  async function deleteTask(task: Task): Promise<void> {
    const oldTasks = [...tasks.value]
    tasks.value = tasks.value.filter(t => t.id !== task.id)

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', task.id)

    if (error) {
      console.error('Error deleting task:', error)
      toast.error('Gagal menghapus tugas: ' + error.message)
      tasks.value = oldTasks
      return
    }

    toast.success('Tugas berhasil dihapus!')

    // Hapus semua file lampiran terkait dari Storage jika ada
    if (task.task_attachments && task.task_attachments.length > 0) {
      const paths = task.task_attachments.map(a => a.file_path)
      try {
        await removeStoragePaths(paths)
      } catch (err) {
        console.warn('Error batch deleting storage files:', err)
      }
    } else if (task.cover_image_url) {
      // Legacy cleanup — path lama `public/{fileName}` tidak punya segmen userId,
      // jadi policy owner-scoped akan menolaknya. Kegagalan di sini hanya
      // meninggalkan file yatim, bukan merusak data.
      try {
        const parts = task.cover_image_url.split('/')
        const fileName = parts[parts.length - 1]
        await supabase.storage.from(PUBLIC_BUCKET).remove([`public/${fileName}`])
      } catch (err) {
        console.error('Error parsing image URL:', err)
      }
    }
  }

  async function updateTaskDueDate(task: Task, dueDate: string | null): Promise<boolean> {
    const targetIdx = tasks.value.findIndex(t => t.id === task.id)
    const oldDueDate = task.due_date

    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      tasks.value[targetIdx].due_date = dueDate
    }
    if (selectedTaskForDetail.value && selectedTaskForDetail.value.id === task.id) {
      selectedTaskForDetail.value.due_date = dueDate
    }

    try {
      const { error } = await (supabase
        .from('todos') as any)
        .update({ due_date: dueDate })
        .eq('id', task.id)

      if (error) {
        console.warn('Gagal mengubah batas waktu tugas di database:', error.message)
        if (targetIdx !== -1 && tasks.value[targetIdx]) {
          tasks.value[targetIdx].due_date = oldDueDate
        }
        if (selectedTaskForDetail.value && selectedTaskForDetail.value.id === task.id) {
          selectedTaskForDetail.value.due_date = oldDueDate
        }
        return false
      }
      toast.info(dueDate ? 'Batas waktu tugas berhasil diperbarui' : 'Batas waktu tugas dihapus')
      return true
    } catch (err) {
      console.warn('Error updating due date:', err)
      if (targetIdx !== -1 && tasks.value[targetIdx]) {
        tasks.value[targetIdx].due_date = oldDueDate
      }
      return false
    }
  }

  // ─── RESET STATE (LOGOUT) ─────────────────────────────────────────────────────
  function resetState(): void {
    tasks.value = []
    lightboxItems.value = []
    lightboxIndex.value = 0
    selectedTaskForAttachments.value = null
    showAttachmentModal.value = false
  }

  // ─── ATTACHMENT MODAL HANDLERS ────────────────────────────────────────────────
  function openAttachmentModal(task: Task): void {
    selectedTaskForAttachments.value = task
    showAttachmentModal.value = true
  }

  function closeAttachmentModal(): void {
    selectedTaskForAttachments.value = null
    showAttachmentModal.value = false
  }

  // ─── TASK DETAIL & WORKSPACE (SOLOFLOW PHASE 3) ───────────────────────────────
  async function openDetailModal(task: Task): Promise<void> {
    selectedTaskForDetail.value = task
    showDetailModal.value = true
    await fetchSubtasksForTask(task.id)
  }

  function closeDetailModal(): void {
    selectedTaskForDetail.value = null
    showDetailModal.value = false
  }

  async function fetchSubtasksForTask(taskId: string | number): Promise<void> {
    try {
      const { data, error } = await (supabase
        .from('subtasks') as any)
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        const targetIdx = tasks.value.findIndex(t => String(t.id) === String(taskId))
        if (targetIdx !== -1 && tasks.value[targetIdx]) {
          tasks.value[targetIdx].subtasks = data as Subtask[]
        }
        if (selectedTaskForDetail.value && String(selectedTaskForDetail.value.id) === String(taskId)) {
          selectedTaskForDetail.value.subtasks = data as Subtask[]
        }
      }
    } catch (err) {
      console.warn('Subtasks fetch error:', err)
    }
  }

  async function saveTaskDescription(taskId: string | number, markdown: string): Promise<boolean> {
    const targetIdx = tasks.value.findIndex(t => String(t.id) === String(taskId))
    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      tasks.value[targetIdx].description_markdown = markdown
    }
    if (selectedTaskForDetail.value && String(selectedTaskForDetail.value.id) === String(taskId)) {
      selectedTaskForDetail.value.description_markdown = markdown
    }

    try {
      const { error } = await (supabase
        .from('todos') as any)
        .update({ description_markdown: markdown })
        .eq('id', taskId)

      if (error) {
        console.warn('Simpan deskripsi markdown gagal:', error.message)
        return false
      }
      toast.success('Catatan tugas berhasil disimpan!')
      return true
    } catch (err: any) {
      console.error('Error save description:', err)
      return false
    }
  }

  async function addSubtask(taskId: string | number, title: string): Promise<Subtask | null> {
    const trimmed = title.trim()
    if (!trimmed) return null

    const tempId = 'temp-' + Date.now()
    const tempSubtask: Subtask = {
      id: tempId,
      task_id: String(taskId),
      title: trimmed,
      is_completed: false,
      created_at: new Date().toISOString()
    }

    // Optimistic local add (selectedTaskForDetail biasanya referensi objek yang sama
    // dari tasks.value, jadi hindari push ganda ke array subtasks yang sama).
    const targetIdx = tasks.value.findIndex(t => String(t.id) === String(taskId))
    const selected = selectedTaskForDetail.value
    const selectedIsTarget = selected && String(selected.id) === String(taskId)
    const selectedIsSameRef = selectedIsTarget && targetIdx !== -1 && selected === tasks.value[targetIdx]

    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      if (!tasks.value[targetIdx].subtasks) tasks.value[targetIdx].subtasks = []
      tasks.value[targetIdx].subtasks!.push(tempSubtask)
    }
    if (selectedIsTarget && !selectedIsSameRef && selected) {
      if (!selected.subtasks) selected.subtasks = []
      selected.subtasks.push(tempSubtask)
    }

    try {
      const { data, error } = await (supabase
        .from('subtasks') as any)
        .insert([{
          task_id: taskId,
          title: trimmed,
          is_completed: false
        }])
        .select()
        .single()

      if (error) {
        console.warn('Simpan subtask ke database gagal (migrasi 06 mungkin belum dijalankan):', error.message)
        return tempSubtask
      }

      if (data) {
        // Ganti id temporary dengan id database asli
        if (targetIdx !== -1 && tasks.value[targetIdx]?.subtasks) {
          const sIdx = tasks.value[targetIdx].subtasks!.findIndex(s => s.id === tempId)
          if (sIdx !== -1) tasks.value[targetIdx].subtasks![sIdx] = data as Subtask
        }
        if (selectedTaskForDetail.value?.subtasks) {
          const sIdx = selectedTaskForDetail.value.subtasks.findIndex(s => s.id === tempId)
          if (sIdx !== -1) selectedTaskForDetail.value.subtasks[sIdx] = data as Subtask
        }
        toast.success('Subtask berhasil ditambahkan!')
        return data as Subtask
      }
    } catch (err) {
      console.warn('Error adding subtask:', err)
    }
    toast.success('Subtask berhasil ditambahkan!')
    return tempSubtask
  }

  async function toggleSubtask(subtask: Subtask): Promise<void> {
    const newCompleted = !subtask.is_completed
    subtask.is_completed = newCompleted

    try {
      if (!subtask.id.startsWith('temp-')) {
        await (supabase
          .from('subtasks') as any)
          .update({ is_completed: newCompleted })
          .eq('id', subtask.id)
      }
    } catch (err) {
      console.warn('Error toggling subtask:', err)
    }
  }

  async function deleteSubtask(subtaskId: string, taskId: string | number): Promise<void> {
    const targetIdx = tasks.value.findIndex(t => String(t.id) === String(taskId))
    if (targetIdx !== -1 && tasks.value[targetIdx]?.subtasks) {
      tasks.value[targetIdx].subtasks = tasks.value[targetIdx].subtasks!.filter(s => s.id !== subtaskId)
    }
    if (selectedTaskForDetail.value?.subtasks && String(selectedTaskForDetail.value.id) === String(taskId)) {
      selectedTaskForDetail.value.subtasks = selectedTaskForDetail.value.subtasks.filter(s => s.id !== subtaskId)
    }

    try {
      if (!subtaskId.startsWith('temp-')) {
        await (supabase
          .from('subtasks') as any)
          .delete()
          .eq('id', subtaskId)
      }
    } catch (err) {
      console.warn('Error deleting subtask:', err)
    }
    toast.info('Subtask berhasil dihapus')
  }

  // ─── PROJECT SPACES (SoloFlow Phase 4: Notion-style Spaces) ───────────────────
  async function fetchProjects(): Promise<void> {
    projectsLoading.value = true
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        if (error.message?.includes('projects') || error.code === 'PGRST204' || error.message?.includes('relation')) {
          console.warn('Tabel projects belum dibuat di Supabase remote.')
          projects.value = []
          return
        }
        console.error('Error fetching projects:', error)
      } else if (data) {
        projects.value = data as Project[]
        // Hubungkan relasi project pada tasks yang sudah dimuat
        tasks.value.forEach(t => {
          if (t.project_id) {
            t.project = projects.value.find(p => String(p.id) === String(t.project_id)) || null
          }
        })
      }
    } catch (err) {
      console.warn('Unexpected error fetching projects:', err)
    } finally {
      projectsLoading.value = false
    }
  }

  function openProjectModal(project?: Project): void {
    selectedProjectForEdit.value = project || null
    showProjectModal.value = true
  }

  function closeProjectModal(): void {
    showProjectModal.value = false
    selectedProjectForEdit.value = null
  }

  async function createProject(payload: ProjectPayload): Promise<Project | null> {
    const trimmedName = payload.name.trim()
    if (!trimmedName) return null

    const currentUserId = user.value?.id || null
    const tempId = 'temp-proj-' + Date.now()
    const tempProject: Project = {
      id: tempId,
      name: trimmedName,
      icon: payload.icon || '📁',
      color: payload.color || '#38bdf8',
      created_at: new Date().toISOString()
    }

    projects.value.push(tempProject)

    try {
      const insertData: any = {
        name: trimmedName,
        icon: payload.icon || '📁',
        color: payload.color || '#38bdf8'
      }
      if (currentUserId) insertData.user_id = currentUserId

      const { data, error } = await (supabase
        .from('projects') as any)
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.warn('Gagal menyimpan project ke Supabase (migrasi 07 mungkin belum dijalankan):', error.message)
        return tempProject
      }

      if (data) {
        const idx = projects.value.findIndex(p => p.id === tempId)
        if (idx !== -1) {
          projects.value[idx] = data as Project
        }
        toast.success(`Ruang kerja '${data.name}' berhasil dibuat!`)
        return data as Project
      }
    } catch (err) {
      console.warn('Error creating project:', err)
    }
    toast.success(`Ruang kerja '${trimmedName}' berhasil dibuat!`)
    return tempProject
  }

  async function updateProject(id: string, payload: ProjectPayload): Promise<boolean> {
    const idx = projects.value.findIndex(p => p.id === id)
    const existing = projects.value[idx]
    if (!existing) return false

    const oldProj: Project = { ...existing }
    const updatedName = payload.name.trim() || oldProj.name
    const updatedIcon = payload.icon || oldProj.icon
    const updatedColor = payload.color || oldProj.color

    const updatedProj: Project = {
      ...oldProj,
      name: updatedName,
      icon: updatedIcon,
      color: updatedColor
    }

    projects.value[idx] = updatedProj

    // Perbarui referensi project pada task di memory
    tasks.value.forEach(t => {
      if (String(t.project_id) === String(id)) {
        t.project = { ...updatedProj }
      }
    })

    try {
      const { error } = await (supabase
        .from('projects') as any)
        .update({
          name: updatedName,
          icon: updatedIcon,
          color: updatedColor
        })
        .eq('id', id)

      if (error) {
        console.warn('Gagal memperbarui project:', error.message)
        projects.value[idx] = oldProj
        return false
      }
      toast.success(`Ruang kerja '${updatedProj.name}' berhasil diperbarui!`)
      return true
    } catch (err) {
      console.warn('Error updating project:', err)
      projects.value[idx] = oldProj
      return false
    }
  }

  async function deleteProject(id: string): Promise<boolean> {
    const oldProjects = [...projects.value]
    projects.value = projects.value.filter(p => p.id !== id)

    // Reset task yang terhubung dengan project ini menjadi unassigned (null)
    tasks.value.forEach(t => {
      if (String(t.project_id) === String(id)) {
        t.project_id = null
        t.project = null
      }
    })

    if (activeProjectId.value === id) {
      activeProjectId.value = null
    }

    try {
      const { error } = await (supabase
        .from('projects') as any)
        .delete()
        .eq('id', id)

      if (error) {
        console.warn('Gagal menghapus project di database:', error.message)
        projects.value = oldProjects
        return false
      }
      toast.success('Ruang kerja berhasil dihapus!')
      return true
    } catch (err) {
      console.warn('Error deleting project:', err)
      projects.value = oldProjects
      return false
    }
  }

  function setActiveProject(projectId: string | null): void {
    activeProjectId.value = projectId
  }

  async function updateTaskProject(taskId: string | number, projectId: string | null): Promise<boolean> {
    const targetIdx = tasks.value.findIndex(t => String(t.id) === String(taskId))
    const matchedProject = projectId ? (projects.value.find(p => String(p.id) === String(projectId)) || null) : null

    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      tasks.value[targetIdx].project_id = projectId
      tasks.value[targetIdx].project = matchedProject
    }
    if (selectedTaskForDetail.value && String(selectedTaskForDetail.value.id) === String(taskId)) {
      selectedTaskForDetail.value.project_id = projectId
      selectedTaskForDetail.value.project = matchedProject
    }

    try {
      const { error } = await (supabase
        .from('todos') as any)
        .update({ project_id: projectId })
        .eq('id', taskId)

      if (error) {
        console.warn('Update task project gagal (kolom project_id mungkin belum ada):', error.message)
        return false
      }
      toast.info(matchedProject ? `Tugas dipindahkan ke '${matchedProject.name}'` : 'Tugas dikeluarkan dari ruang kerja')
      return true
    } catch (err) {
      console.warn('Error updating task project:', err)
      return false
    }
  }

  function getProjectTaskCount(projectId: string): number {
    return tasks.value.filter(t => String(t.project_id) === String(projectId)).length
  }

  // ─── LIGHTBOX GALERI ──────────────────────────────────────────────────────────
  function openLightboxGallery(items: LightboxMediaItem[], startIndex = 0): void {
    if (items.length === 0) return
    lightboxItems.value = items
    lightboxIndex.value = Math.max(0, Math.min(startIndex, items.length - 1))
  }

  function openLightbox(url: string, title?: string): void {
    openLightboxGallery([{ url, title }])
  }

  function closeLightbox(): void {
    lightboxItems.value = []
    lightboxIndex.value = 0
  }

  function nextLightboxImage(): void {
    if (lightboxItems.value.length <= 1) return
    lightboxIndex.value = (lightboxIndex.value + 1) % lightboxItems.value.length
  }

  function prevLightboxImage(): void {
    if (lightboxItems.value.length <= 1) return
    lightboxIndex.value =
      (lightboxIndex.value - 1 + lightboxItems.value.length) % lightboxItems.value.length
  }

  // ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
  function formatBackupDate(iso: string | null): string {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes || bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ─── Task Templates (Sprint 3 — AI Natural Language Quick Add & Templates) ─────
  async function fetchTemplates(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching task templates:', error)
        templates.value = []
        return
      }
      templates.value = (data ?? []) as TaskTemplate[]
    } catch (err) {
      console.error('Unexpected error fetching task templates:', err)
      templates.value = []
    }
  }

  async function createTaskFromTemplate(template: TaskTemplate): Promise<boolean> {
    const saved = await addTask({
      taskText: template.title_template,
      priority: template.priority || 'MEDIUM',
      status: 'TODO',
      projectId: null,
      dueDate: null,
      tags: template.tags || [],
      estimatedHours: template.estimated_hours || 0,
      actualHours: 0,
      files: []
    })
    return saved
  }

  async function deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('task_templates').delete().eq('id', id)
      if (error) {
        console.error('Error deleting task template:', error)
        return
      }
      templates.value = templates.value.filter(t => t.id !== id)
    } catch (err) {
      console.error('Unexpected error deleting task template:', err)
    }
  }

  // ─── PROJECT NOTES / WIKI (Sprint 4) ─────────────────────────────────────────
  function openProjectNotes(project: Project): void {
    selectedProjectForNotes.value = project
    showProjectNotesModal.value = true
    fetchProjectNotes(project.id)
  }

  function closeProjectNotes(): void {
    showProjectNotesModal.value = false
  }

  async function fetchProjectNotes(projectId: string): Promise<void> {
    projectNotesLoading.value = true
    try {
      const { data, error } = await (supabase as any)
        .from('project_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.warn('Gagal mengambil catatan project:', error.message)
        projectNotes.value = []
        return
      }
      projectNotes.value = (data ?? []) as ProjectNote[]
    } catch (err) {
      console.warn('Error fetching project notes:', err)
      projectNotes.value = []
    } finally {
      projectNotesLoading.value = false
    }
  }

  async function createProjectNote(payload: ProjectNotePayload): Promise<ProjectNote | null> {
    try {
      let currentUserId = user.value?.id
      if (!currentUserId) {
        const { data: userData } = await supabase.auth.getUser()
        currentUserId = userData?.user?.id
      }
      const insert: any = {
        project_id: payload.project_id,
        user_id: currentUserId,
        title: (payload.title || 'Catatan Tanpa Judul').trim(),
        content_markdown: payload.content_markdown || ''
      }
      const { data, error } = await (supabase as any)
        .from('project_notes')
        .insert([insert])
        .select()
        .single()

      if (error) {
        console.warn('Gagal membuat catatan project:', error.message)
        toast.error('Gagal membuat catatan.')
        return null
      }
      const note = data as ProjectNote
      projectNotes.value.unshift(note)
      toast.success('Catatan berhasil dibuat!')
      return note
    } catch (err) {
      console.warn('Error creating project note:', err)
      toast.error('Gagal membuat catatan.')
      return null
    }
  }

  async function updateProjectNote(id: string, updates: Partial<ProjectNotePayload>): Promise<boolean> {
    const idx = projectNotes.value.findIndex(n => n.id === id)
    const oldNote = idx !== -1 ? projectNotes.value[idx] : null
    if (idx !== -1 && projectNotes.value[idx]) {
      projectNotes.value[idx] = { ...projectNotes.value[idx], ...updates, updated_at: new Date().toISOString() } as ProjectNote
    }
    try {
      const { error } = await (supabase as any)
        .from('project_notes')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.warn('Gagal memperbarui catatan project:', error.message)
        if (oldNote && idx !== -1) projectNotes.value[idx] = oldNote
        toast.error('Gagal menyimpan catatan.')
        return false
      }
      toast.success('Catatan tersimpan.')
      return true
    } catch (err) {
      console.warn('Error updating project note:', err)
      if (oldNote && idx !== -1) projectNotes.value[idx] = oldNote
      toast.error('Gagal menyimpan catatan.')
      return false
    }
  }

  async function deleteProjectNote(id: string): Promise<boolean> {
    const oldNotes = [...projectNotes.value]
    projectNotes.value = projectNotes.value.filter(n => n.id !== id)
    try {
      const { error } = await (supabase as any)
        .from('project_notes')
        .delete()
        .eq('id', id)

      if (error) {
        console.warn('Gagal menghapus catatan project:', error.message)
        projectNotes.value = oldNotes
        toast.error('Gagal menghapus catatan.')
        return false
      }
      toast.success('Catatan dihapus.')
      return true
    } catch (err) {
      console.warn('Error deleting project note:', err)
      projectNotes.value = oldNotes
      toast.error('Gagal menghapus catatan.')
      return false
    }
  }

  // ─── RETURN ───────────────────────────────────────────────────────────────────
  return {
    // State
    tasks,
    pending,
    uploading,
    sidebarCollapsed,
    lightboxItems,
    lightboxIndex,
    lightboxImage,
    selectedTaskForAttachments,
    showAttachmentModal,
    selectedTaskForDetail,
    showDetailModal,
    detailLoading,

    // Project Spaces (SoloFlow Phase 4: Notion-style Spaces)
    projects,
    activeProjectId,
    activeProject,
    showProjectModal,
    selectedProjectForEdit,
    projectsLoading,

    // View & Filter State
    viewMode,
    searchQuery,
    setViewMode,

    // Getters
    filteredTasks,
    tasksByStatus,
    completedCount,
    activeCount,
    progressPercent,

    // Actions — Storage v2 & CRUD
    fetchTasks,
    addTask,
    addAttachmentsToTask,
    deleteAttachment,
    toggleTask,
    updateTaskStatus,
    editTask,
    deleteTask,
    updateTaskDueDate,
    logFocusTime,
    getThumbnailUrl,
    getPublicOriginalUrl,
    createSignedDownloadUrl,
    getCachedSignedUrl,
    ensureSignedUrl,
    removeStoragePaths,
    downloadAttachment,

    // Actions — Attachment Modal
    openAttachmentModal,
    closeAttachmentModal,

    // Actions — Task Detail Modal & Workspace (Phase 3)
    openDetailModal,
    closeDetailModal,
    fetchSubtasksForTask,
    saveTaskDescription,
    addSubtask,
    toggleSubtask,
    deleteSubtask,

    // Actions — Project Spaces (Phase 4)
    fetchProjects,
    openProjectModal,
    closeProjectModal,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject,
    updateTaskProject,
    getProjectTaskCount,

    // Actions — Project Notes / Wiki (Sprint 4)
    projectNotes,
    projectNotesLoading,
    showProjectNotesModal,
    selectedProjectForNotes,
    openProjectNotes,
    closeProjectNotes,
    fetchProjectNotes,
    createProjectNote,
    updateProjectNote,
    deleteProjectNote,

    // Actions — Task Templates (Sprint 3)
    templates,
    activeMenuTaskId,
    showTemplateModal,
    openTemplateModal,
    closeTemplateModal,
    fetchTemplates,
    createTaskFromTemplate,
    deleteTemplate,

    // Actions — Lifecycle
    resetState,

    // Actions — Lightbox Galeri
    openLightboxGallery,
    openLightbox,
    closeLightbox,
    nextLightboxImage,
    prevLightboxImage,

    // Actions — Format Helpers
    formatBackupDate,
    formatFileSize
  }
})
