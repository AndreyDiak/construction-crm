import type { ObjectRow } from '@/shared/api/database.types'

export interface ObjectListItem extends ObjectRow {
  active_task_count: number
}
