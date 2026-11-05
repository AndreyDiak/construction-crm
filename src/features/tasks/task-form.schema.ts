import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Укажите название задачи')
    .max(200, 'Название не должно превышать 200 символов'),
  description: z
    .string()
    .max(5000, 'Описание не должно превышать 5000 символов')
    .optional(),
  assignee_id: z.string().min(1, 'Выберите исполнителя'),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
