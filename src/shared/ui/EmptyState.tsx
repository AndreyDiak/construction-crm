import { Box, Stack, Text } from '@chakra-ui/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="gray.300"
      borderRadius="xl"
      bg="white"
      px="6"
      py="12"
      textAlign="center"
    >
      <Stack align="center" gap="4">
        <Box p="3" borderRadius="full" bg="gray.100" color="gray.500">
          <Icon size={28} />
        </Box>
        <Stack gap="1" align="center">
          <Text fontWeight="semibold" fontSize="lg" color="gray.900">
            {title}
          </Text>
          {description && (
            <Text color="gray.600" maxW="md">
              {description}
            </Text>
          )}
        </Stack>
        {action}
      </Stack>
    </Box>
  )
}
