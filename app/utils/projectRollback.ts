type ProjectRefLike = { id: string } | null

interface TaskProjectLike {
  project_id?: string | null
  project?: ProjectRefLike
}

export interface TaskProjectSnapshot {
  task: TaskProjectLike
  project_id?: string | null
  project?: ProjectRefLike
}

/** Simpan nilai project sebelum update optimistik supaya bisa dipulihkan saat error. */
export function captureTaskProject(task: TaskProjectLike): TaskProjectSnapshot {
  return { task, project_id: task.project_id, project: task.project }
}

/** Pulihkan semua task yang tersimpan dalam snapshot. */
export function restoreTaskProjects(snapshots: TaskProjectSnapshot[]): void {
  for (const snapshot of snapshots) {
    snapshot.task.project_id = snapshot.project_id
    snapshot.task.project = snapshot.project
  }
}
