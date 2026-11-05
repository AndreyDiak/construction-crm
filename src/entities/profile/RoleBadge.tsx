import { Badge } from '@chakra-ui/react'
import type { UserRole } from '@/shared/api/database.types'

const ROLE_META: Record<UserRole, { label: string; colorPalette: string }> = {
  manager: { label: 'Постановщик', colorPalette: 'purple' },
  executor: { label: 'Исполнитель', colorPalette: 'blue' },
}

export function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role]

  return (
    <Badge colorPalette={meta.colorPalette} variant="subtle">
      {meta.label}
    </Badge>
  )
}
