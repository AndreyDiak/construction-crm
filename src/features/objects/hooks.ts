import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/shared/lib/errors'
import { toaster } from '@/shared/ui/toaster-store'
import {
  createObject,
  getObject,
  listObjects,
  softDeleteObject,
  updateObject,
  type ObjectFormInput,
} from './api'

export const objectKeys = {
  all: ['objects'] as const,
  detail: (id: string) => ['objects', 'detail', id] as const,
}

function invalidateObjects() {
  return ['objects'] as const
}

export function useObjects() {
  return useQuery({
    queryKey: objectKeys.all,
    queryFn: listObjects,
  })
}

export function useObject(id: string | undefined) {
  return useQuery({
    queryKey: objectKeys.detail(id ?? ''),
    queryFn: () => getObject(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateObject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ObjectFormInput) => createObject(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invalidateObjects() })
      toaster.success({ title: 'Объект создан' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Не удалось создать объект',
        description: getErrorMessage(error),
      })
    },
  })
}

export function useUpdateObject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ObjectFormInput }) =>
      updateObject(id, input),
    onSuccess: (object) => {
      void queryClient.invalidateQueries({ queryKey: invalidateObjects() })
      void queryClient.invalidateQueries({ queryKey: objectKeys.detail(object.id) })
      toaster.success({ title: 'Объект обновлён' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Не удалось обновить объект',
        description: getErrorMessage(error),
      })
    },
  })
}

export function useDeleteObject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => softDeleteObject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invalidateObjects() })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toaster.success({ title: 'Объект удалён' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Не удалось удалить объект',
        description: getErrorMessage(error),
      })
    },
  })
}
