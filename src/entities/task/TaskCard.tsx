import { Box, Card, Flex, HStack, Link, Text } from '@chakra-ui/react'
import { CalendarDays, MapPin, UserRound } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { formatDateTime } from '@/shared/lib/format'
import { TaskStatusBadge } from './TaskStatusBadge'
import type { TaskWithRelations } from './types'

type TaskCardProps = {
  task: TaskWithRelations
  showObject?: boolean
}

export function TaskCard({ task, showObject = false }: TaskCardProps) {
  return (
    <Card.Root variant="outline" bg="white">
      <Card.Body gap="3">
        <Flex justify="space-between" align="flex-start" gap="3" wrap="wrap">
          <Box minW="0" flex="1">
            <Link
              asChild
              fontWeight="semibold"
              color="gray.900"
              _hover={{ color: 'blue.600' }}
            >
              <RouterLink to={`/tasks/${task.id}`}>{task.title}</RouterLink>
            </Link>
            {showObject && task.object && (
              <HStack mt="1.5" color="gray.600" fontSize="sm" gap="1.5">
                <MapPin size={14} />
                <Text lineClamp={1}>{task.object.name}</Text>
              </HStack>
            )}
          </Box>
          <TaskStatusBadge status={task.status} />
        </Flex>

        <HStack gap="4" color="gray.600" fontSize="sm" wrap="wrap">
          <HStack gap="1.5">
            <UserRound size={14} />
            <Text>{task.assignee?.full_name ?? 'Исполнитель не назначен'}</Text>
          </HStack>
          <HStack gap="1.5">
            <CalendarDays size={14} />
            <Text>Обновлена {formatDateTime(task.updated_at)}</Text>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
