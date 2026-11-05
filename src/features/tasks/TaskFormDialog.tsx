import {
  Alert,
  Button,
  Dialog,
  Field,
  Input,
  NativeSelect,
  Portal,
  Stack,
  Textarea,
} from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { TaskWithRelations } from '@/entities/task/types'
import { getErrorMessage } from '@/shared/lib/errors'
import { useCreateTask, useExecutors, useUpdateTask } from './hooks'
import { taskFormSchema, type TaskFormValues } from './task-form.schema'

type TaskFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectId: string
  task?: TaskWithRelations | null
}

export function TaskFormDialog({
  open,
  onOpenChange,
  objectId,
  task,
}: TaskFormDialogProps) {
  const createMutation = useCreateTask(objectId)
  const updateMutation = useUpdateTask()
  const executorsQuery = useExecutors(open)
  const isEditing = Boolean(task)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: '', description: '', assignee_id: '' },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      assignee_id: task?.assignee_id ?? '',
    })
  }, [open, task, reset])

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      title: values.title,
      description: values.description ?? '',
      assignee_id: values.assignee_id,
    }

    try {
      if (task) {
        await updateMutation.mutateAsync({ id: task.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }

      onOpenChange(false)
    } catch {
      // Error toast is shown by the mutation hook.
    }
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const hasExecutors = (executorsQuery.data?.length ?? 0) > 0

  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.subtle"
            boxShadow="0 24px 60px rgba(28, 35, 35, 0.14)"
          >
            <form onSubmit={onSubmit}>
              <Dialog.Header>
                <Dialog.Title>
                  {isEditing ? 'Редактировать задачу' : 'Новая задача'}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <Stack gap="4">
                  {executorsQuery.isError && (
                    <Alert.Root status="error" variant="subtle">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>Не удалось загрузить исполнителей</Alert.Title>
                        <Alert.Description>
                          {getErrorMessage(executorsQuery.error)}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  )}

                  {!executorsQuery.isLoading && !executorsQuery.isError && !hasExecutors && (
                    <Alert.Root status="warning" variant="subtle">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>Нет доступных исполнителей</Alert.Title>
                        <Alert.Description>
                          Создайте пользователя с ролью executor в Supabase Dashboard.
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  )}

                  <Field.Root invalid={Boolean(errors.title)}>
                    <Field.Label>Название</Field.Label>
                    <Input
                      {...register('title')}
                      placeholder="Что нужно сделать"
                      autoFocus
                    />
                    <Field.ErrorText>{errors.title?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={Boolean(errors.description)}>
                    <Field.Label>Описание</Field.Label>
                    <Textarea
                      {...register('description')}
                      placeholder="Детали задачи, требования, материалы"
                      rows={5}
                    />
                    <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={Boolean(errors.assignee_id)}>
                    <Field.Label>Исполнитель</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        {...register('assignee_id')}
                        placeholder="Выберите исполнителя"
                      >
                        {(executorsQuery.data ?? []).map((executor) => (
                          <option key={executor.id} value={executor.id}>
                            {executor.full_name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.ErrorText>{errors.assignee_id?.message}</Field.ErrorText>
                  </Field.Root>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Отмена
                </Button>
                <Button
                  type="submit"
                  colorPalette="brand"
                  loading={isPending}
                  disabled={!hasExecutors || executorsQuery.isError}
                >
                  {isEditing ? 'Сохранить' : 'Создать'}
                </Button>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
