import {
  Alert,
  Button,
  Card,
  Flex,
  HStack,
  Heading,
  Icon,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { ArrowLeft, CalendarDays, ClipboardList, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { TaskCard } from '@/entities/task/TaskCard'
import type { TaskWithRelations } from '@/entities/task/types'
import { useAuth } from '@/features/auth/auth-context'
import { useDeleteObject, useObject } from '@/features/objects/hooks'
import { ObjectFormDialog } from '@/features/objects/ObjectFormDialog'
import { useObjectTasks } from '@/features/tasks/hooks'
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog'
import { formatDate } from '@/shared/lib/format'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'

export function ObjectDetailsPage() {
  const { objectId } = useParams<{ objectId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const objectQuery = useObject(objectId)
  const tasksQuery = useObjectTasks(objectId)
  const deleteObjectMutation = useDeleteObject()

  const [editObjectOpen, setEditObjectOpen] = useState(false)
  const [deleteObjectOpen, setDeleteObjectOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)

  const isManager = profile?.role === 'manager'

  if (objectQuery.isLoading) {
    return <LoadingState rows={3} />
  }

  if (objectQuery.isError) {
    return (
      <ErrorState
        error={objectQuery.error}
        onRetry={() => void objectQuery.refetch()}
      />
    )
  }

  if (!objectQuery.data) {
    return (
      <EmptyState
        icon={MapPin}
        title="Объект недоступен"
        description="Объект не найден или у вас нет к нему доступа."
        action={
          <Button asChild variant="outline">
            <RouterLink to="/objects">Вернуться к объектам</RouterLink>
          </Button>
        }
      />
    )
  }

  const object = objectQuery.data
  const objectDeleted = object.is_deleted

  const handleDeleteObject = async () => {
    try {
      await deleteObjectMutation.mutateAsync(object.id)
      navigate('/objects', { replace: true })
    } catch {
      // Error toast is shown by the mutation hook.
    }
  }

  const openCreateTask = () => {
    setEditingTask(null)
    setTaskFormOpen(true)
  }

  const openEditTask = (task: TaskWithRelations) => {
    setEditingTask(task)
    setTaskFormOpen(true)
  }

  return (
    <>
      <Link asChild color="gray.600" fontSize="sm" mb="4" _hover={{ color: 'blue.600' }}>
        <RouterLink to="/objects">
          <HStack gap="1.5">
            <ArrowLeft size={16} />
            <Text>Все объекты</Text>
          </HStack>
        </RouterLink>
      </Link>

      <Card.Root variant="outline" bg="white" mb="6">
        <Card.Body>
          <Flex justify="space-between" align="flex-start" gap="4" wrap="wrap">
            <Stack gap="2">
              <Heading size="2xl" color="gray.900">
                {object.name}
              </Heading>
              <HStack color="gray.600" align="flex-start" gap="2">
                <Icon mt="0.5">
                  <MapPin size={18} />
                </Icon>
                <Text>{object.address}</Text>
              </HStack>
              <HStack color="gray.500" fontSize="sm" gap="2">
                <CalendarDays size={14} />
                <Text>Создан {formatDate(object.created_at)}</Text>
              </HStack>
            </Stack>

            {isManager && !objectDeleted && (
              <HStack gap="2">
                <Button variant="outline" onClick={() => setEditObjectOpen(true)}>
                  <Pencil size={16} />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  colorPalette="red"
                  onClick={() => setDeleteObjectOpen(true)}
                >
                  <Trash2 size={16} />
                  Удалить
                </Button>
              </HStack>
            )}
          </Flex>
        </Card.Body>
      </Card.Root>

      {objectDeleted && (
        <Alert.Root status="warning" variant="subtle" borderRadius="lg" mb="6">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Объект удалён</Alert.Title>
            <Alert.Description>
              Объект скрыт из списков. Задачи доступны только для просмотра, действия по ним
              недоступны.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Flex justify="space-between" align="center" gap="4" mb="4" wrap="wrap">
        <Stack gap="1">
          <Heading size="lg" color="gray.900">
            Задачи
          </Heading>
          <Text color="gray.600" fontSize="sm">
            {isManager
              ? 'Все задачи по объекту.'
              : 'Здесь показаны только задачи, назначенные вам.'}
          </Text>
        </Stack>

        {isManager && !objectDeleted && (
          <Button colorPalette="blue" onClick={openCreateTask}>
            <Plus size={16} />
            Добавить задачу
          </Button>
        )}
      </Flex>

      {tasksQuery.isLoading && <LoadingState rows={3} />}

      {tasksQuery.isError && (
        <ErrorState error={tasksQuery.error} onRetry={() => void tasksQuery.refetch()} />
      )}

      {tasksQuery.isSuccess && tasksQuery.data.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Задач пока нет"
          description={
            isManager
              ? 'Создайте первую задачу и назначьте исполнителя.'
              : 'Постановщик ещё не назначил вам задачи по этому объекту.'
          }
          action={
            isManager && !objectDeleted ? (
              <Button colorPalette="blue" onClick={openCreateTask}>
                <Plus size={16} />
                Добавить задачу
              </Button>
            ) : undefined
          }
        />
      )}

      {tasksQuery.isSuccess && tasksQuery.data.length > 0 && (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
          {tasksQuery.data.map((task) => (
            <Stack key={task.id} gap="2">
              <TaskCard task={task} />
              {isManager && !objectDeleted && (
                <HStack justify="flex-end" gap="1">
                  <Button size="xs" variant="ghost" onClick={() => openEditTask(task)}>
                    <Pencil size={14} />
                    Изменить
                  </Button>
                </HStack>
              )}
            </Stack>
          ))}
        </SimpleGrid>
      )}

      <ObjectFormDialog
        open={editObjectOpen}
        onOpenChange={setEditObjectOpen}
        object={object}
      />

      <ConfirmDialog
        open={deleteObjectOpen}
        onOpenChange={setDeleteObjectOpen}
        title="Удалить объект?"
        description={`Объект «${object.name}» будет скрыт из списков. История задач сохранится, но новые действия по задачам станут недоступны.`}
        isLoading={deleteObjectMutation.isPending}
        onConfirm={() => {
          void handleDeleteObject()
        }}
      />

      <TaskFormDialog
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        objectId={object.id}
        task={editingTask}
      />
    </>
  )
}
