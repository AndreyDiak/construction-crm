import { Badge, Button, HStack, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { ClipboardList } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { TaskCard } from '@/entities/task/TaskCard'
import { useAuth } from '@/features/auth/auth-context'
import { useMyTasks } from '@/features/tasks/hooks'
import { TASK_STATUS_META, TASK_STATUS_ORDER } from '@/shared/lib/task-status'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'

export function MyTasksPage() {
  const { profile } = useAuth()
  const tasksQuery = useMyTasks(profile?.id)

  if (profile?.role === 'manager') {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Раздел для исполнителей"
        description="У постановщика нет назначенных задач. Задачи доступны в карточках объектов."
        action={
          <Button asChild colorPalette="brand">
            <RouterLink to="/objects">Перейти к объектам</RouterLink>
          </Button>
        }
      />
    )
  }

  const tasks = tasksQuery.data ?? []
  const counts = TASK_STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  })).filter((item) => item.count > 0)

  return (
    <>
      <PageHeader
        title="Мои задачи"
        description="Задачи, назначенные на вас по всем объектам."
      />

      {tasksQuery.isLoading && <LoadingState rows={4} />}

      {tasksQuery.isError && (
        <ErrorState error={tasksQuery.error} onRetry={() => void tasksQuery.refetch()} />
      )}

      {tasksQuery.isSuccess && tasks.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Назначенных задач нет"
          description="Когда постановщик назначит вам задачу, она появится в этом списке."
        />
      )}

      {tasksQuery.isSuccess && tasks.length > 0 && (
        <Stack gap="5">
          {counts.length > 0 && (
            <HStack gap="2" wrap="wrap">
              {counts.map(({ status, count }) => (
                <Badge
                  key={status}
                  colorPalette={TASK_STATUS_META[status].colorPalette}
                  variant="subtle"
                  size="lg"
                >
                  {TASK_STATUS_META[status].label}: {count}
                </Badge>
              ))}
            </HStack>
          )}

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4.5">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} showObject />
            ))}
          </SimpleGrid>

          <Text fontSize="sm" color="gray.500">
            Откройте задачу, чтобы посмотреть историю и выполнить доступные действия.
          </Text>
        </Stack>
      )}
    </>
  )
}
