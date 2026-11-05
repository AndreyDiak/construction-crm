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
      borderColor="border.muted"
      borderRadius="2xl"
      bg="bg.surface"
      px="6"
      py="14"
      textAlign="center"
    >
      <Stack align="center" gap="4">
        <Box
          p="3.5"
          borderRadius="full"
          bg="brand.subtle"
          color="brand.fg"
          borderWidth="1px"
          borderColor="brand.emphasized"
        >
          <Icon size={26} />
        </Box>
        <Stack gap="1.5" align="center">
          <Text fontWeight="semibold" fontSize="lg" color="gray.900">
            {title}
          </Text>
          {description && (
            <Text color="gray.600" maxW="md" lineHeight="1.6">
              {description}
            </Text>
          )}
        </Stack>
        {action}
      </Stack>
    </Box>
  )
}
