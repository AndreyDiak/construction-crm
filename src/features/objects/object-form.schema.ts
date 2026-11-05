import { z } from 'zod'

export const objectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Укажите название объекта')
    .max(200, 'Название не должно превышать 200 символов'),
  address: z
    .string()
    .trim()
    .min(1, 'Укажите адрес объекта')
    .max(500, 'Адрес не должен превышать 500 символов'),
})

export type ObjectFormValues = z.infer<typeof objectFormSchema>
