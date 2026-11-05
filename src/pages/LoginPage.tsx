import {
  Box,
  Card,
  Center,
  Flex,
  Heading,
  Icon,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Building2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { LoginForm } from '@/features/auth/LoginForm'

export function LoginPage() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Center minH="100vh" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Center>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <Flex minH="100vh" bg="gray.50" align="center" justify="center" px="4" py="10">
      <Stack gap="6" width="full" maxW="420px">
        <Flex align="center" gap="3">
          <Box p="3" bg="blue.600" color="white" borderRadius="xl">
            <Icon>
              <Building2 size={26} />
            </Icon>
          </Box>
          <Box>
            <Heading size="xl" color="gray.900">
              СтройCRM
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Объекты и задачи строительной компании
            </Text>
          </Box>
        </Flex>

        <Card.Root variant="outline" bg="white">
          <Card.Header>
            <Card.Title>Вход в систему</Card.Title>
            <Card.Description>
              Используйте учётную запись, созданную администратором.
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <LoginForm />
          </Card.Body>
          <Card.Footer>
            <Text fontSize="xs" color="gray.500">
              Регистрация отключена. Новые пользователи создаются через Supabase
              Dashboard.
            </Text>
          </Card.Footer>
        </Card.Root>
      </Stack>
    </Flex>
  )
}
