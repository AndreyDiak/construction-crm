import type { TaskStatus, UserRole } from '@/shared/api/database.types'

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'new',
  'in_progress',
  'on_review',
  'accepted',
  'needs_rework',
]

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; colorPalette: string; description: string }
> = {
  new: {
    label: 'Новая',
    colorPalette: 'blue',
    description: 'Задача создана и ждёт исполнителя',
  },
  in_progress: {
    label: 'В работе',
    colorPalette: 'orange',
    description: 'Исполнитель работает над задачей',
  },
  on_review: {
    label: 'На проверке',
    colorPalette: 'purple',
    description: 'Исполнитель отправил результат постановщику',
  },
  accepted: {
    label: 'Принята',
    colorPalette: 'green',
    description: 'Постановщик принял результат',
  },
  needs_rework: {
    label: 'На доработке',
    colorPalette: 'red',
    description: 'Постановщик вернул задачу с комментарием',
  },
}

export type TransitionDefinition = {
  to: TaskStatus
  role: UserRole
  label: string
  requiresComment?: boolean
}

export const TASK_TRANSITIONS: Record<TaskStatus, TransitionDefinition[]> = {
  new: [{ to: 'in_progress', role: 'executor', label: 'Взять в работу' }],
  in_progress: [{ to: 'on_review', role: 'executor', label: 'Отправить на проверку' }],
  on_review: [
    { to: 'accepted', role: 'manager', label: 'Принять' },
    {
      to: 'needs_rework',
      role: 'manager',
      label: 'Вернуть на доработку',
      requiresComment: true,
    },
  ],
  accepted: [],
  needs_rework: [{ to: 'in_progress', role: 'executor', label: 'Взять в работу' }],
}

export function getAvailableTransitions(
  status: TaskStatus,
  role: UserRole,
): TransitionDefinition[] {
  return TASK_TRANSITIONS[status].filter((transition) => transition.role === role)
}
