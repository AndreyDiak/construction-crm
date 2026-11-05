import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Flex
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
      gap="4"
      mb="7"
    >
      <Box>
        <Heading size="2xl" color="gray.900" letterSpacing="-0.025em">
          {title}
        </Heading>
        {description && (
          <Text mt="2" color="gray.600" maxW="2xl">
            {description}
          </Text>
        )}
      </Box>
      {actions && <Box>{actions}</Box>}
    </Flex>
  )
}
