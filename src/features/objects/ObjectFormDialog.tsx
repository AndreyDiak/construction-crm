import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Textarea,
} from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { ObjectRow } from '@/shared/api/database.types'
import { useCreateObject, useUpdateObject } from './hooks'
import { objectFormSchema, type ObjectFormValues } from './object-form.schema'

type ObjectFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  object?: ObjectRow | null
}

export function ObjectFormDialog({ open, onOpenChange, object }: ObjectFormDialogProps) {
  const createMutation = useCreateObject()
  const updateMutation = useUpdateObject()
  const isEditing = Boolean(object)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObjectFormValues>({
    resolver: zodResolver(objectFormSchema),
    defaultValues: { name: '', address: '' },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    reset({
      name: object?.name ?? '',
      address: object?.address ?? '',
    })
  }, [open, object, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (object) {
        await updateMutation.mutateAsync({ id: object.id, input: values })
      } else {
        await createMutation.mutateAsync(values)
      }

      onOpenChange(false)
    } catch {
      // Error toast is shown by the mutation hook.
    }
  })

  const isPending = createMutation.isPending || updateMutation.isPending

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
                  {isEditing ? 'Редактировать объект' : 'Новый объект'}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <Stack gap="4">
                  <Field.Root invalid={Boolean(errors.name)}>
                    <Field.Label>Название</Field.Label>
                    <Input
                      {...register('name')}
                      placeholder="Например, ЖК «Северный», корпус 2"
                      autoFocus
                      borderColor="border.subtle"
                    />
                    <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={Boolean(errors.address)}>
                    <Field.Label>Адрес</Field.Label>
                    <Textarea
                      {...register('address')}
                      placeholder="Город, улица, дом"
                      rows={3}
                      borderColor="border.subtle"
                    />
                    <Field.ErrorText>{errors.address?.message}</Field.ErrorText>
                  </Field.Root>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Отмена
                </Button>
                <Button type="submit" colorPalette="brand" loading={isPending}>
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
