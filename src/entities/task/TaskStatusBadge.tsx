import { Badge } from '@chakra-ui/react'
import type { TaskStatus } from '@/shared/api/database.types'
import { TASK_STATUS_META } from '@/shared/lib/task-status'

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status]

  return (
    <Badge colorPalette={meta.colorPalette} variant="subtle" borderRadius="md" px="2.5">
      {meta.label}
    </Badge>
  )
}
