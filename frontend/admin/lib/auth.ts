export type UserRole = 'admin' | 'empresa'

export interface UserProfile {
  user_id: string
  role: UserRole
  empresa_id?: string | null
  nombre?: string | null
  email?: string | null
}
