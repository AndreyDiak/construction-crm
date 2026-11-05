import { Badge, Box, Button, Card, Flex, HStack, IconButton, Link, Text } from '@chakra-ui/react'
import { ClipboardList, MapPin, Pencil, Trash2 } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import type { ObjectListItem } from './types'

type ObjectCardProps = {
  object: ObjectListItem
  isManager: boolean
  onEdit: (object: ObjectListItem) => void
  onDelete: (object: ObjectListItem) => void
}

export function ObjectCard({ object, isManager, onEdit, onDelete }: ObjectCardProps) {
  return (
    <Card.Root
      variant="outline"
      bg="bg.surface"
      height="100%"
      borderColor="border.subtle"
      borderRadius="2xl"
      transition="border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease"
      _hover={{
        borderColor: 'brand.emphasized',
        boxShadow: '0 12px 32px rgba(28, 35, 35, 0.06)',
        transform: 'translateY(-1px)',
      }}
    >
      <Card.Body gap="4">
        <Flex justify="space-between" align="flex-start" gap="3">
          <Box minW="0">
            <Link
              asChild
              fontWeight="semibold"
              fontSize="lg"
              color="gray.900"
              letterSpacing="-0.01em"
              _hover={{ color: 'brand.fg' }}
            >
              <RouterLink to={`/objects/${object.id}`}>{object.name}</RouterLink>
            </Link>
            <HStack mt="2" color="gray.600" align="flex-start" gap="1.5">
              <Box color="gray.400" mt="0.5">
                <MapPin size={16} />
              </Box>
              <Text fontSize="sm" lineClamp={2} lineHeight="1.5">
                {object.address}
              </Text>
            </HStack>
          </Box>
        </Flex>

        <HStack gap="2" wrap="wrap">
          <Badge colorPalette="brand" variant="subtle" borderRadius="md">
            <ClipboardList size={12} />
            Задач: {object.active_task_count}
          </Badge>
        </HStack>
      </Card.Body>

      <Card.Footer pt="0">
        <HStack justify="space-between" width="full">
          <Button asChild size="sm" variant="ghost" colorPalette="brand">
            <RouterLink to={`/objects/${object.id}`}>Открыть объект</RouterLink>
          </Button>

          {isManager && (
            <HStack gap="1">
              <IconButton
                aria-label="Редактировать объект"
                size="sm"
                variant="ghost"
                onClick={() => onEdit(object)}
              >
                <Pencil size={16} />
              </IconButton>
              <IconButton
                aria-label="Удалить объект"
                size="sm"
                variant="ghost"
                colorPalette="red"
                onClick={() => onDelete(object)}
              >
                <Trash2 size={16} />
              </IconButton>
            </HStack>
          )}
        </HStack>
      </Card.Footer>
    </Card.Root>
  )
}
