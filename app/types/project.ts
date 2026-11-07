export interface Project {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export interface ProjectPayload {
  name: string
  icon?: string
  color?: string
}
