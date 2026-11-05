export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'manager' | 'executor'

export type TaskStatus = 'new' | 'in_progress' | 'on_review' | 'accepted' | 'needs_rework'

export type ProfileRow = {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

export type ObjectRow = {
  id: string
  name: string
  address: string
  created_by: string
  created_at: string
  is_deleted: boolean
}

export type TaskRow = {
  id: string
  title: string
  description: string | null
  object_id: string
  assignee_id: string
  author_id: string
  status: TaskStatus
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export type TaskStatusHistoryRow = {
  id: string
  task_id: string
  changed_by: string
  from_status: TaskStatus | null
  to_status: TaskStatus
  comment: string | null
  created_at: string
}

type TableDefinition<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<
        ProfileRow,
        {
          id: string
          full_name: string
          role?: UserRole
          created_at?: string
        },
        {
          id?: string
          full_name?: string
          role?: UserRole
          created_at?: string
        }
      >
      objects: TableDefinition<
        ObjectRow,
        {
          id?: string
          name: string
          address: string
          created_by?: string
          created_at?: string
          is_deleted?: boolean
        },
        {
          id?: string
          name?: string
          address?: string
          created_by?: string
          created_at?: string
          is_deleted?: boolean
        }
      >
      tasks: TableDefinition<
        TaskRow,
        {
          id?: string
          title: string
          description?: string | null
          object_id: string
          assignee_id: string
          author_id?: string
          status?: TaskStatus
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
        },
        {
          id?: string
          title?: string
          description?: string | null
          object_id?: string
          assignee_id?: string
          author_id?: string
          status?: TaskStatus
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
        }
      >
      task_status_history: TableDefinition<
        TaskStatusHistoryRow,
        {
          id?: string
          task_id: string
          changed_by: string
          from_status?: TaskStatus | null
          to_status: TaskStatus
          comment?: string | null
          created_at?: string
        },
        {
          id?: string
          task_id?: string
          changed_by?: string
          from_status?: TaskStatus | null
          to_status?: TaskStatus
          comment?: string | null
          created_at?: string
        }
      >
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      transition_task_status: {
        Args: {
          p_task_id: string
          p_to_status: TaskStatus
          p_comment?: string | null
        }
        Returns: TaskRow
      }
    }
    Enums: {
      user_role: UserRole
      task_status: TaskStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
