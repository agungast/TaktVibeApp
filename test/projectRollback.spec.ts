import { describe, it, expect } from 'vitest'
import { captureTaskProject, restoreTaskProjects } from '../app/utils/projectRollback'

describe('project rollback', () => {
  it('mengembalikan project_id dan project setelah optimistik diubah', () => {
    const oldProject = { id: 'p1', name: 'Lama' }
    const task = { project_id: 'p1' as string | null, project: oldProject }
    const snapshot = captureTaskProject(task)

    task.project_id = null
    task.project = null
    restoreTaskProjects([snapshot])

    expect(task.project_id).toBe('p1')
    expect(task.project).toBe(oldProject)
  })
})
