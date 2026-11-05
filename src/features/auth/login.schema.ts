import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
})

export type LoginValues = z.infer<typeof loginSchema>
