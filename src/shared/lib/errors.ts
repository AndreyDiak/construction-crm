type ErrorLike = {
  message?: string
  code?: string
  details?: string
  hint?: string
}

const MESSAGE_MAP: Record<string, string> = {
  'Invalid login credentials': 'Неверный email или пароль',
  'Email not confirmed': 'Email не подтверждён. Обратитесь к администратору',
  'User not found': 'Пользователь не найден',
  'JWT expired': 'Сессия истекла. Войдите снова',
  'permission denied for table tasks': 'Недостаточно прав для изменения задачи',
  'permission denied for table objects': 'Недостаточно прав для изменения объекта',
  'permission denied for table profiles': 'Недостаточно прав для изменения профиля',
  'permission denied for table task_status_history': 'Историю задач изменять нельзя',
  'new row violates row-level security policy for table "tasks"':
    'Действие запрещено политикой доступа к задачам',
  'new row violates row-level security policy for table "objects"':
    'Действие запрещено политикой доступа к объектам',
}

export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'Неизвестная ошибка'
  }

  if (typeof error === 'string') {
    return MESSAGE_MAP[error] ?? error
  }

  if (error instanceof Error) {
    return MESSAGE_MAP[error.message] ?? error.message
  }

  const candidate = error as ErrorLike
  const message = candidate.message?.trim()

  if (message) {
    return MESSAGE_MAP[message] ?? message
  }

  if (candidate.code === '42501') {
    return 'Недостаточно прав для выполнения действия'
  }

  if (candidate.code === 'PGRST116') {
    return 'Запись не найдена или недоступна'
  }

  if (candidate.code === '23514') {
    return 'Действие нарушает бизнес-правила'
  }

  if (candidate.code === '23503') {
    return 'Связанная запись не найдена'
  }

  return 'Не удалось выполнить действие'
}
