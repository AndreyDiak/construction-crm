import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { TaskStatus } from '@/shared/api/database.types'
import { listExecutors } from '@/entities/profile/api'
import { getErrorMessage } from '@/shared/lib/errors'
import { toaster } from '@/shared/ui/toaster-store'
import {
  createTask,
  getTask,
  getTaskHistory,
  listMyTasks,
  listTasksByObject,
  softDeleteTask,
  transitionTaskStatus,
  updateTask,
  type TaskFormInput,
} from './api'

export const taskKeys = {
  all: ['tasks'] as const,
  byObject: (objectId: string) => ['tasks', 'object', objectId] as const,
  my: (userId: string) => ['tasks', 'my', userId] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
  history: (id: string) => ['tasks', 'history', id] as const,
  executors: ['profiles', 'executors'] as const,
}

function invalidateTaskData(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: taskKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['objects'] })
}

export function useObjectTasks(objectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.byObject(objectId ?? ''),
    queryFn: () => listTasksByObject(objectId as string),
    enabled: Boolean(objectId),
  })
}

export function useMyTasks(userId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.my(userId ?? ''),
    queryFn: () => listMyTasks(userId as string),
    enabled: Boolean(userId),
  })
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ''),
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId),
  })
}

export function useTaskHistory(taskId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.history(taskId ?? ''),
    queryFn: () => getTaskHistory(taskId as string),
    enabled: Boolean(taskId),
  })
}

export function useExecutors(enabled = true) {
  return useQuery({
    queryKey: taskKeys.executors,
    queryFn: listExecutors,
    enabled,
  })
}

export function useCreateTask(objectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TaskFormInput) => createTask(objectId, input),
    onSuccess: () => {
      invalidateTaskData(queryClient)
      toaster.success({ title: 'Задача создана' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Не удалось создать задачу',
        description: getErrorMessage(error),
      })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskFormInput }) =>
      updateTask(id, input),
    onSuccess: () => {
      invalidateTaskData(queryClient)
      toaster.success({ title: 'Задача обновлена' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Не удалось обновить задачу',
        description: getErrorMessage(error),
      })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => softDeleteTask(id),
    onSuccess: () => {
      invalidateTaskData(queryClient)
      toaster.success({ title: 'Задача удалена' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Не удалось удалить задачу',
        description: getErrorMessage(error),
      })
    },
  })
}

export function useTransitionTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { taskId: string; to: TaskStatus; comment?: string | null }) =>
      transitionTaskStatus(input),
    onSuccess: () => {
      invalidateTaskData(queryClient)
      toaster.success({ title: 'Статус задачи обновлён' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Не удалось изменить статус',
        description: getErrorMessage(error),
      })
    },
  })
}
