import type {
  ProfileRow,
  TaskRow,
  TaskStatusHistoryRow,
  UserRole,
} from '@/shared/api/database.types'

export interface TaskObjectRef {
  id: string
  name: string
  address: string
  is_deleted: boolean
}

export interface TaskProfileRef {
  id: string
  full_name: string
  role: UserRole
}

export interface TaskWithRelations extends TaskRow {
  object: TaskObjectRef | null
  assignee: TaskProfileRef | null
  author: TaskProfileRef | null
}

export interface TaskHistoryItem extends TaskStatusHistoryRow {
  changed_by_profile: TaskProfileRef | null
}

export type Executor = ProfileRow
