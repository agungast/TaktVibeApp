import type { Task, TaskStatus, Subtask, Project, ProjectNote, TaskTemplate } from '~/types/task'
import { useToastStore } from '~/stores/toastStore'

export function useTaskCore(ctx: any) {
  const supabase = ctx.supabase
  const user = ctx.user
  const tasks = ctx.tasks
  const pending = ctx.pending
  const uploading = ctx.uploading
  const projects = ctx.projects
  const selectedTaskForDetail = ctx.selectedTaskForDetail
  const detailLoading = ctx.detailLoading
  const subtasksCache = ctx.subtasksCache || ref<Record<string, Subtask[]>>({})

  const toast = {
    error: (msg: string, title?: string) => useToastStore().error(msg, title),
    success: (msg: string, title?: string) => useToastStore().success(msg, title),
    info: (msg: string, title?: string) => useToastStore().addToast({ message: msg, type: 'info', title })
  }

  const parseTags = ctx.parseTags

  async function fetchTasks(): Promise<void> {
    pending.value = true
    try {
      let { data, error } = await supabase
        .from('todos')
        .select('*, task_attachments(*), subtasks(*)')
        .order('created_at', { ascending: false })

      if (error && (error.message?.includes('subtasks') || error.code === 'PGRST204' || error.message?.includes('relation'))) {
        const fallback = await supabase
          .from('todos')
          .select('*, task_attachments(*)')
          .order('created_at', { ascending: false })
        data = fallback.data
        error = fallback.error
      }

      if (error) {
        console.error('Error fetching tasks:', error)
      } else {
        tasks.value = (data ?? []).map((t: any) => {
          const rawAtts = t.task_attachments ?? []
          const seen = new Set()
          const uniqueAtts = rawAtts.filter((a: any) => {
            if (seen.has(a.id)) return false
            seen.add(a.id)
            return true
          })
          const rawSubtasks = (t.subtasks ?? []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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
            project: projects.value?.find((p: Project) => String(p.id) === String(t.project_id)) || null,
            task_attachments: uniqueAtts,
            subtasks: rawSubtasks
          }
        })
      }
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err)
    } finally {
      pending.value = false
    }
  }

  async function toggleTask(task: Task): Promise<void> {
    const previousStatus = task.status
    const newStatus: TaskStatus = previousStatus === 'DONE' ? 'TODO' : 'DONE'
    const targetIdx = tasks.value.findIndex((t: Task) => t.id === task.id)
    if (targetIdx !== -1 && tasks.value[targetIdx]) tasks.value[targetIdx].status = newStatus
    const { error } = await (supabase.from('todos') as any).update({ status: newStatus }).eq('id', task.id)
    if (error) {
      toast.error('Gagal memperbarui status tugas')
      if (targetIdx !== -1 && tasks.value[targetIdx]) tasks.value[targetIdx].status = previousStatus
    } else {
      if (newStatus === 'DONE') toast.success(`Tugas '${task.title}' selesai.`)
      else toast.info(`Status '${task.title}' diubah ke Belum Selesai`)
    }
  }

  async function updateTaskStatus(task: Task, newStatus: TaskStatus): Promise<void> {
    const oldStatus = task.status
    const targetIdx = tasks.value.findIndex((t: Task) => t.id === task.id)
    if (targetIdx !== -1 && tasks.value[targetIdx]) tasks.value[targetIdx].status = newStatus
    let { error } = await (supabase.from('todos') as any).update({ status: newStatus, is_completed: newStatus === 'DONE' }).eq('id', task.id)
    if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
      const fallback = await (supabase.from('todos') as any).update({ is_completed: newStatus === 'DONE' }).eq('id', task.id)
      error = fallback.error
    }
    if (error) {
      toast.error('Gagal memperbarui status tugas')
      if (targetIdx !== -1 && tasks.value[targetIdx]) tasks.value[targetIdx].status = oldStatus
    } else {
      toast.info(`Status '${task.title}' diubah ke ${newStatus}`)
    }
  }

  async function deleteTask(task: Task): Promise<void> {
    const oldTasks = [...tasks.value]
    tasks.value = tasks.value.filter((t: Task) => t.id !== task.id)
    try {
      const { error } = await (supabase.from('todos') as any).delete().eq('id', task.id)
      if (error) {
        tasks.value = oldTasks
        toast.error('Gagal menghapus tugas')
        return
      }
      toast.success('Tugas berhasil dihapus!')
    } catch {
      tasks.value = oldTasks
      toast.error('Gagal menghapus tugas')
    }
  }

  async function updateTaskDueDate(task: Task, dueDate: string | null): Promise<boolean> {
    const targetIdx = tasks.value.findIndex((t: Task) => t.id === task.id)
    const oldDue = targetIdx !== -1 ? tasks.value[targetIdx]?.due_date : task.due_date
    if (targetIdx !== -1 && tasks.value[targetIdx]) tasks.value[targetIdx].due_date = dueDate
    try {
      const { error } = await (supabase.from('todos') as any).update({ due_date: dueDate }).eq('id', task.id)
      if (error) {
        if (targetIdx !== -1 && tasks.value[targetIdx]) tasks.value[targetIdx].due_date = oldDue
        return false
      }
      return true
    } catch {
      if (targetIdx !== -1 && tasks.value[targetIdx]) tasks.value[targetIdx].due_date = oldDue
      return false
    }
  }

  async function logFocusTime(taskId: string, minutesSpent: number): Promise<void> {
    const targetIdx = tasks.value.findIndex((t: Task) => String(t.id) === String(taskId))
    if (targetIdx !== -1 && tasks.value[targetIdx]) {
      const current = Number(tasks.value[targetIdx].actual_hours || 0)
      tasks.value[targetIdx].actual_hours = Math.round((current + minutesSpent / 60) * 10) / 10
    }
    try {
      await (supabase.rpc as any)('increment_actual_hours', { p_task_id: taskId, p_minutes: minutesSpent })
    } catch {
      if (targetIdx !== -1 && tasks.value[targetIdx]) {
        const current = Number(tasks.value[targetIdx].actual_hours || 0)
        tasks.value[targetIdx].actual_hours = Math.round((current + minutesSpent / 60) * 10) / 10
        await (supabase.from('todos') as any).update({ actual_hours: tasks.value[targetIdx].actual_hours }).eq('id', taskId)
      }
    }
  }

  return {
    fetchTasks,
    toggleTask,
    updateTaskStatus,
    deleteTask,
    updateTaskDueDate,
    logFocusTime
  }
}
