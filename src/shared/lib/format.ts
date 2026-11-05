const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
})

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value))
}
