import type { ObjectRow, TaskRow } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'
import type { ObjectListItem } from '@/entities/object/types'

type ObjectWithTaskRefs = ObjectRow & {
  tasks: Pick<TaskRow, 'id' | 'is_deleted'>[] | null
}

export type ObjectFormInput = {
  name: string
  address: string
}

export async function listObjects(): Promise<ObjectListItem[]> {
  const { data, error } = await supabase
    .from('objects')
    .select('id, name, address, created_by, created_at, is_deleted, tasks(id, is_deleted)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as unknown as ObjectWithTaskRefs[]

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    created_by: row.created_by,
    created_at: row.created_at,
    is_deleted: row.is_deleted,
    active_task_count: (row.tasks ?? []).filter((task) => !task.is_deleted).length,
  }))
}

export async function getObject(id: string): Promise<ObjectRow | null> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as ObjectRow | null) ?? null
}

export async function createObject(input: ObjectFormInput): Promise<ObjectRow> {
  const { data, error } = await supabase
    .from('objects')
    .insert({ name: input.name, address: input.address })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as ObjectRow
}

export async function updateObject(
  id: string,
  input: ObjectFormInput,
): Promise<ObjectRow> {
  const { data, error } = await supabase
    .from('objects')
    .update({ name: input.name, address: input.address })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as ObjectRow
}

export async function softDeleteObject(id: string): Promise<void> {
  const { error } = await supabase
    .from('objects')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    throw error
  }
}
