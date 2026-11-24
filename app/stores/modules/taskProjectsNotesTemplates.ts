import type { Project, ProjectPayload, ProjectNote, ProjectNotePayload, TaskTemplate } from '~/types/task'
import { useToastStore } from '~/stores/toastStore'

export function useTaskProjectsNotesTemplates(ctx: any) {
  const supabase = ctx.supabase
  const user = ctx.user
  const tasks = ctx.tasks
  const projects = ctx.projects
  const activeProjectId = ctx.activeProjectId
  const showProjectModal = ctx.showProjectModal
  const selectedProjectForEdit = ctx.selectedProjectForEdit
  const projectsLoading = ctx.projectsLoading
  const templates = ctx.templates
  const showTemplateModal = ctx.showTemplateModal
  const projectNotes = ctx.projectNotes
  const projectNotesLoading = ctx.projectNotesLoading
  const showProjectNotesModal = ctx.showProjectNotesModal
  const selectedProjectForNotes = ctx.selectedProjectForNotes

  const toast = {
    error: (msg: string, title?: string) => useToastStore().error(msg, title),
    success: (msg: string, title?: string) => useToastStore().success(msg, title),
    info: (msg: string, title?: string) => useToastStore().addToast({ message: msg, type: 'info', title })
  }

  function openTemplateModal(): void { showTemplateModal.value = true }
  function closeTemplateModal(): void { showTemplateModal.value = false }

  async function fetchTemplates(): Promise<void> {
    try {
      const { data, error } = await supabase.from('task_templates').select('*').order('created_at', { ascending: false })
      if (error) { templates.value = []; return }
      templates.value = (data ?? []) as TaskTemplate[]
    } catch { templates.value = [] }
  }

  async function createTaskFromTemplate(template: TaskTemplate): Promise<boolean> {
    const saved = await ctx.addTask({
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
      await supabase.from('task_templates').delete().eq('id', id)
      templates.value = templates.value.filter((t: TaskTemplate) => t.id !== id)
    } catch {}
  }

  async function fetchProjects(): Promise<void> {
    projectsLoading.value = true
    try {
      const { data, error } = await (supabase as any).from('projects').select('*').order('created_at', { ascending: true })
      if (error) { projects.value = []; return }
      projects.value = (data ?? []) as Project[]
    } catch { projects.value = [] } finally { projectsLoading.value = false }
  }

  function openProjectModal(project?: Project): void { selectedProjectForEdit.value = project || null; showProjectModal.value = true }
  function closeProjectModal(): void { showProjectModal.value = false }
  function setActiveProject(projectId: string | null): void { activeProjectId.value = projectId }

  async function createProject(payload: ProjectPayload): Promise<Project | null> {
    try {
      let currentUserId = user.value?.id
      if (!currentUserId) { const { data: userData } = await supabase.auth.getUser(); currentUserId = userData?.user?.id }
      const insert: any = { name: payload.name.trim(), icon: payload.icon || 'PRJ', color: payload.color || '#38bdf8' }
      if (currentUserId) insert.user_id = currentUserId
      const { data, error } = await (supabase as any).from('projects').insert([insert]).select().single()
      if (error) { toast.error('Gagal membuat ruang kerja'); return null }
      const project = data as Project
      projects.value.push(project)
      toast.success(`Ruang kerja '${project.name}' berhasil dibuat!`)
      return project
    } catch { toast.error('Gagal membuat ruang kerja'); return null }
  }

  async function updateProject(id: string, payload: ProjectPayload): Promise<boolean> {
    const idx = projects.value.findIndex((p: Project) => p.id === id)
    const oldProj = idx !== -1 ? { ...projects.value[idx] } : null
    if (idx !== -1 && projects.value[idx]) projects.value[idx] = { ...projects.value[idx], ...payload } as Project
    try {
      const { error } = await (supabase as any).from('projects').update({ name: payload.name?.trim(), icon: payload.icon, color: payload.color }).eq('id', id)
      if (error) { if (oldProj && idx !== -1) projects.value[idx] = oldProj; toast.error('Gagal memperbarui ruang kerja'); return false }
      toast.success('Ruang kerja berhasil diperbarui!')
      return true
    } catch { if (oldProj && idx !== -1) projects.value[idx] = oldProj; toast.error('Gagal memperbarui ruang kerja'); return false }
  }

  async function deleteProject(id: string): Promise<boolean> {
    const oldProjects = [...projects.value]
    projects.value = projects.value.filter((p: Project) => p.id !== id)
    tasks.value.forEach((t: any) => { if (String(t.project_id) === String(id)) { t.project_id = null; t.project = null } })
    if (activeProjectId.value === id) activeProjectId.value = null
    try {
      const { error } = await (supabase as any).from('projects').delete().eq('id', id)
      if (error) { projects.value = oldProjects; toast.error('Gagal menghapus ruang kerja'); return false }
      toast.success('Ruang kerja berhasil dihapus!')
      return true
    } catch { projects.value = oldProjects; toast.error('Gagal menghapus ruang kerja'); return false }
  }

  async function updateTaskProject(taskId: string | number, projectId: string | null): Promise<boolean> {
    const targetIdx = tasks.value.findIndex((t: any) => String(t.id) === String(taskId))
    const matchedProject = projectId ? (projects.value.find((p: Project) => String(p.id) === String(projectId)) || null) : null
    if (targetIdx !== -1 && tasks.value[targetIdx]) { tasks.value[targetIdx].project_id = projectId; tasks.value[targetIdx].project = matchedProject }
    try {
      const { error } = await (supabase.from('todos') as any).update({ project_id: projectId }).eq('id', taskId)
      if (error) return false
      toast.info(matchedProject ? `Tugas dipindahkan ke '${matchedProject.name}'` : 'Tugas dikeluarkan dari ruang kerja')
      return true
    } catch { return false }
  }

  function getProjectTaskCount(projectId: string): number {
    return tasks.value.filter((t: any) => String(t.project_id) === String(projectId)).length
  }

  function openProjectNotes(project: Project): void { selectedProjectForNotes.value = project; showProjectNotesModal.value = true; fetchProjectNotes(project.id) }
  function closeProjectNotes(): void { showProjectNotesModal.value = false }
  async function fetchProjectNotes(projectId: string): Promise<void> {
    projectNotesLoading.value = true
    try {
      const { data, error } = await (supabase as any).from('project_notes').select('*').eq('project_id', projectId).order('updated_at', { ascending: false })
      if (error) { projectNotes.value = []; return }
      projectNotes.value = (data ?? []) as ProjectNote[]
    } catch { projectNotes.value = [] } finally { projectNotesLoading.value = false }
  }
  async function createProjectNote(payload: ProjectNotePayload): Promise<ProjectNote | null> {
    try {
      let currentUserId = user.value?.id
      if (!currentUserId) { const { data: userData } = await supabase.auth.getUser(); currentUserId = userData?.user?.id }
      const insert: any = { project_id: payload.project_id, user_id: currentUserId, title: (payload.title || 'Catatan Tanpa Judul').trim(), content_markdown: payload.content_markdown || '' }
      const { data, error } = await (supabase as any).from('project_notes').insert([insert]).select().single()
      if (error) { toast.error('Gagal membuat catatan.'); return null }
      const note = data as ProjectNote
      projectNotes.value.unshift(note)
      toast.success('Catatan berhasil dibuat!')
      return note
    } catch { toast.error('Gagal membuat catatan.'); return null }
  }
  async function updateProjectNote(id: string, updates: Partial<ProjectNotePayload>): Promise<boolean> {
    try {
      const { error } = await (supabase as any).from('project_notes').update(updates).eq('id', id)
      if (error) { toast.error('Gagal menyimpan catatan.'); return false }
      toast.success('Catatan tersimpan.')
      return true
    } catch { toast.error('Gagal menyimpan catatan.'); return false }
  }
  async function deleteProjectNote(id: string): Promise<boolean> {
    const oldNotes = [...projectNotes.value]
    projectNotes.value = projectNotes.value.filter((n: ProjectNote) => n.id !== id)
    try {
      const { error } = await (supabase as any).from('project_notes').delete().eq('id', id)
      if (error) { projectNotes.value = oldNotes; toast.error('Gagal menghapus catatan.'); return false }
      toast.success('Catatan dihapus.')
      return true
    } catch { projectNotes.value = oldNotes; toast.error('Gagal menghapus catatan.'); return false }
  }

  return {
    openTemplateModal, closeTemplateModal, fetchTemplates, createTaskFromTemplate, deleteTemplate,
    fetchProjects, openProjectModal, closeProjectModal, createProject, updateProject, deleteProject, setActiveProject, updateTaskProject, getProjectTaskCount,
    openProjectNotes, closeProjectNotes, fetchProjectNotes, createProjectNote, updateProjectNote, deleteProjectNote
  }
}
