import type { TaskRow, TaskStatus } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import type { TaskHistoryItem, TaskWithRelations } from '@/entities/task/types'

const TASK_SELECT = `
  id,
  title,
  description,
  object_id,
  assignee_id,
  author_id,
  status,
  created_at,
  updated_at,
  is_deleted,
  object:objects!tasks_object_id_fkey(id, name, address, is_deleted),
  assignee:profiles!tasks_assignee_id_fkey(id, full_name, role),
  author:profiles!tasks_author_id_fkey(id, full_name, role)
`

const HISTORY_SELECT = `
  id,
  task_id,
  changed_by,
  from_status,
  to_status,
  comment,
  created_at,
  changed_by_profile:profiles!task_status_history_changed_by_fkey(id, full_name, role)
`

export type TaskFormInput = {
  title: string
  description: string
  assignee_id: string
}

export async function listTasksByObject(objectId: string): Promise<TaskWithRelations[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('object_id', objectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as TaskWithRelations[]
}

export async function listMyTasks(userId: string): Promise<TaskWithRelations[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('assignee_id', userId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as TaskWithRelations[]
}

export async function getTask(id: string): Promise<TaskWithRelations | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as unknown as TaskWithRelations | null) ?? null
}

export async function getTaskHistory(taskId: string): Promise<TaskHistoryItem[]> {
  const { data, error } = await supabase
    .from('task_status_history')
    .select(HISTORY_SELECT)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as TaskHistoryItem[]
}

export async function createTask(
  objectId: string,
  input: TaskFormInput,
): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description.trim() || null,
      object_id: objectId,
      assignee_id: input.assignee_id,
    })
    .select(TASK_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as TaskRow
}

export async function updateTask(id: string, input: TaskFormInput): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: input.title,
      description: input.description.trim() || null,
      assignee_id: input.assignee_id,
    })
    .eq('id', id)
    .select(TASK_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as TaskRow
}

export async function softDeleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function transitionTaskStatus(input: {
  taskId: string
  to: TaskStatus
  comment?: string | null
}): Promise<TaskRow> {
  const { data, error } = await supabase.rpc('transition_task_status', {
    p_task_id: input.taskId,
    p_to_status: input.to,
    p_comment: input.comment ?? null,
  })

  if (error) {
    throw error
  }

  return data as TaskRow
}
