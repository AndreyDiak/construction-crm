import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  HStack,
  Heading,
  Icon,
  Link,
  Separator,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  History,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { TaskStatusBadge } from '@/entities/task/TaskStatusBadge'
import { useAuth } from '@/features/auth/auth-context'
import {
  useDeleteTask,
  useTask,
  useTaskHistory,
} from '@/features/tasks/hooks'
import { TaskActions } from '@/features/tasks/TaskActions'
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog'
import { formatDateTime } from '@/shared/lib/format'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <HStack align="flex-start" gap="3">
      <Box color="gray.500" mt="0.5">
        {icon}
      </Box>
      <Box>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">
          {label}
        </Text>
        <Box mt="0.5" color="gray.900" fontWeight="medium">
          {children}
        </Box>
      </Box>
    </HStack>
  )
}

export function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const taskQuery = useTask(taskId)
  const historyQuery = useTaskHistory(taskId)
  const deleteMutation = useDeleteTask()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isManager = profile?.role === 'manager'

  if (taskQuery.isLoading) {
    return <LoadingState rows={4} />
  }

  if (taskQuery.isError) {
    return (
      <ErrorState error={taskQuery.error} onRetry={() => void taskQuery.refetch()} />
    )
  }

  if (!taskQuery.data) {
    return (
      <EmptyState
        icon={MapPin}
        title="Задача недоступна"
        description="Задача не найдена, удалена или назначена другому исполнителю."
        action={
          <Button asChild variant="outline">
            <RouterLink to="/objects">Вернуться к объектам</RouterLink>
          </Button>
        }
      />
    )
  }

  const task = taskQuery.data
  const backLink = task.object ? `/objects/${task.object_id}` : '/objects'
  const objectDeleted = Boolean(task.object?.is_deleted)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(task.id)
      navigate(backLink, { replace: true })
    } catch {
      // Error toast is shown by the mutation hook.
    }
  }

  return (
    <>
      <Link asChild color="gray.600" fontSize="sm" mb="4" _hover={{ color: 'blue.600' }}>
        <RouterLink to={backLink}>
          <HStack gap="1.5">
            <ArrowLeft size={16} />
            <Text>{task.object ? task.object.name : 'Все объекты'}</Text>
          </HStack>
        </RouterLink>
      </Link>

      <Flex justify="space-between" align="flex-start" gap="4" mb="6" wrap="wrap">
        <Stack gap="2">
          <HStack gap="3" wrap="wrap">
            <Heading size="2xl" color="gray.900">
              {task.title}
            </Heading>
            <TaskStatusBadge status={task.status} />
            {task.is_deleted && (
              <Badge colorPalette="gray" variant="subtle">
                Удалена
              </Badge>
            )}
          </HStack>
          {task.object && (
            <HStack color="gray.600" fontSize="sm" gap="1.5">
              <MapPin size={14} />
              <Link asChild _hover={{ color: 'blue.600' }}>
                <RouterLink to={`/objects/${task.object_id}`}>
                  {task.object.name}
                </RouterLink>
              </Link>
            </HStack>
          )}
        </Stack>

        {profile && !task.is_deleted && !objectDeleted && (
          <HStack gap="2" wrap="wrap">
            <TaskActions task={task} role={profile.role} />
            {isManager && (
              <>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil size={16} />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  colorPalette="red"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={16} />
                  Удалить
                </Button>
              </>
            )}
          </HStack>
        )}
      </Flex>

      {objectDeleted && (
        <Alert.Root status="warning" variant="subtle" borderRadius="lg" mb="6">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Объект удалён</Alert.Title>
            <Alert.Description>
              Задача доступна только для просмотра. Смена статуса и редактирование недоступны.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Stack gap="6">
        <Card.Root variant="outline" bg="white">
          <Card.Header>
            <Card.Title>Описание и параметры</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap="6">
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                  Описание
                </Text>
                <Text mt="2" color={task.description ? 'gray.800' : 'gray.500'} whiteSpace="pre-wrap">
                  {task.description || 'Описание не указано'}
                </Text>
              </Box>

              <Separator />

              <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
                <MetaItem icon={<MapPin size={18} />} label="Объект">
                  {task.object ? (
                    <Link asChild color="blue.600" _hover={{ textDecoration: 'underline' }}>
                      <RouterLink to={`/objects/${task.object_id}`}>
                        {task.object.name}
                      </RouterLink>
                    </Link>
                  ) : (
                    'Объект недоступен'
                  )}
                </MetaItem>

                <MetaItem icon={<UserRound size={18} />} label="Исполнитель">
                  {task.assignee?.full_name ?? 'Не назначен'}
                </MetaItem>

                <MetaItem icon={<UserRound size={18} />} label="Автор">
                  {task.author?.full_name ?? 'Неизвестно'}
                </MetaItem>

                <MetaItem icon={<CalendarDays size={18} />} label="Создана">
                  {formatDateTime(task.created_at)}
                </MetaItem>

                <MetaItem icon={<CalendarDays size={18} />} label="Обновлена">
                  {formatDateTime(task.updated_at)}
                </MetaItem>
              </SimpleGrid>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="outline" bg="white">
          <Card.Header>
            <HStack gap="2">
              <Icon color="gray.500">
                <History size={20} />
              </Icon>
              <Card.Title>История статусов</Card.Title>
            </HStack>
          </Card.Header>
          <Card.Body>
            {historyQuery.isLoading && <LoadingState rows={2} />}

            {historyQuery.isError && (
              <ErrorState
                error={historyQuery.error}
                onRetry={() => void historyQuery.refetch()}
              />
            )}

            {historyQuery.isSuccess && historyQuery.data.length === 0 && (
              <Text color="gray.500">История пока пуста.</Text>
            )}

            {historyQuery.isSuccess && historyQuery.data.length > 0 && (
              <Stack gap="0">
                {historyQuery.data.map((item, index) => (
                  <HStack key={item.id} align="flex-start" gap="3">
                    <Stack align="center" alignSelf="stretch" width="3" flexShrink="0">
                      <Box mt="1.5" boxSize="2.5" borderRadius="full" bg="blue.500" />
                      {index < historyQuery.data.length - 1 && (
                        <Box flex="1" width="1px" bg="gray.200" minH="24px" />
                      )}
                    </Stack>

                    <Box flex="1" pb="5">
                      <HStack gap="2" wrap="wrap">
                        {item.from_status ? (
                          <>
                            <TaskStatusBadge status={item.from_status} />
                            <Icon color="gray.400" boxSize="3.5">
                              <ArrowRight size={14} />
                            </Icon>
                          </>
                        ) : (
                          <Badge colorPalette="gray" variant="subtle">
                            Создание
                          </Badge>
                        )}
                        <TaskStatusBadge status={item.to_status} />
                      </HStack>

                      <HStack mt="2" gap="2" color="gray.500" fontSize="sm" wrap="wrap">
                        <Text>{item.changed_by_profile?.full_name ?? 'Система'}</Text>
                        <Text>•</Text>
                        <Text>{formatDateTime(item.created_at)}</Text>
                      </HStack>

                      {item.comment && (
                        <Box mt="2" bg="gray.50" borderRadius="md" px="3" py="2">
                          <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                            {item.comment}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </HStack>
                ))}
              </Stack>
            )}
          </Card.Body>
        </Card.Root>
      </Stack>

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        objectId={task.object_id}
        task={task}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить задачу?"
        description={`Задача «${task.title}» будет скрыта. История изменений сохранится.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          void handleDelete()
        }}
      />
    </>
  )
}
