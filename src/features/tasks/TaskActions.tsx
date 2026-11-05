import {
  Button,
  Dialog,
  Field,
  HStack,
  Portal,
  Stack,
  Textarea,
} from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { TaskStatus, UserRole } from '@/shared/api/database.types'
import type { TaskWithRelations } from '@/entities/task/types'
import {
  getAvailableTransitions,
  type TransitionDefinition,
} from '@/shared/lib/task-status'
import { useTransitionTask } from './hooks'

const commentSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, 'Комментарий обязателен при возврате на доработку')
    .max(2000, 'Комментарий не должен превышать 2000 символов'),
})

type CommentValues = z.infer<typeof commentSchema>

type TaskActionsProps = {
  task: TaskWithRelations
  role: UserRole
}

function transitionColor(to: TaskStatus): string {
  if (to === 'accepted') {
    return 'green'
  }

  if (to === 'needs_rework') {
    return 'red'
  }

  return 'blue'
}

export function TaskActions({ task, role }: TaskActionsProps) {
  const transitionMutation = useTransitionTask()
  const [commentTransition, setCommentTransition] =
    useState<TransitionDefinition | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { comment: '' },
  })

  useEffect(() => {
    if (commentTransition) {
      reset({ comment: '' })
    }
  }, [commentTransition, reset])

  const transitions = getAvailableTransitions(task.status, role)

  if (transitions.length === 0) {
    return null
  }

  const runTransition = async (to: TaskStatus, comment?: string) => {
    try {
      await transitionMutation.mutateAsync({
        taskId: task.id,
        to,
        comment: comment ?? null,
      })
      return true
    } catch {
      return false
    }
  }

  const onCommentSubmit = handleSubmit(async (values) => {
    if (!commentTransition) {
      return
    }

    if (await runTransition(commentTransition.to, values.comment)) {
      setCommentTransition(null)
    }
  })

  return (
    <>
      <HStack gap="2" wrap="wrap">
        {transitions.map((transition) => (
          <Button
            key={`${transition.to}-${transition.label}`}
            colorPalette={transitionColor(transition.to)}
            onClick={() => {
              if (transition.requiresComment) {
                setCommentTransition(transition)
                return
              }

              void runTransition(transition.to)
            }}
            loading={
              transitionMutation.isPending &&
              transitionMutation.variables?.to === transition.to
            }
          >
            {transition.label}
          </Button>
        ))}
      </HStack>

      <Dialog.Root
        open={Boolean(commentTransition)}
        onOpenChange={(details) => {
          if (!details.open) {
            setCommentTransition(null)
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <form onSubmit={onCommentSubmit}>
                <Dialog.Header>
                  <Dialog.Title>{commentTransition?.label}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap="4">
                    <Field.Root invalid={Boolean(errors.comment)}>
                      <Field.Label>Комментарий</Field.Label>
                      <Textarea
                        {...register('comment')}
                        rows={4}
                        placeholder="Что необходимо доработать"
                        autoFocus
                      />
                      <Field.ErrorText>{errors.comment?.message}</Field.ErrorText>
                    </Field.Root>
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="ghost" onClick={() => setCommentTransition(null)}>
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    colorPalette="red"
                    loading={transitionMutation.isPending}
                  >
                    Вернуть на доработку
                  </Button>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
