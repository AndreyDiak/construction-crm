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
      <Center minH="100vh" bg="bg.app">
        <Spinner size="lg" color="brand.solid" />
      </Center>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return (
    <Flex
      className="login-atmosphere"
      position="relative"
      minH="100vh"
      align="center"
      justify="center"
      px="4"
      py="10"
    >
      <Stack gap="8" width="full" maxW="420px" position="relative" zIndex="1">
        <Flex align="center" gap="3.5">
          <Box
            p="3"
            bg="brand.solid"
            color="white"
            borderRadius="xl"
            boxShadow="0 10px 28px rgba(47, 111, 107, 0.22)"
          >
            <Icon>
              <Building2 size={26} />
            </Icon>
          </Box>
          <Box>
            <Heading size="xl" color="gray.900" letterSpacing="-0.02em">
              СтройCRM
            </Heading>
            <Text color="gray.600" fontSize="sm" mt="0.5">
              Объекты и задачи строительной компании
            </Text>
          </Box>
        </Flex>

        <Card.Root
          variant="outline"
          bg="bg.surface"
          borderColor="border.subtle"
          borderRadius="2xl"
          boxShadow="0 18px 50px rgba(28, 35, 35, 0.06)"
        >
          <Card.Header pb="2">
            <Card.Title fontSize="lg">Вход в систему</Card.Title>
            <Card.Description color="gray.600">
              Используйте учётную запись, созданную администратором.
            </Card.Description>
          </Card.Header>
          <Card.Body pt="2">
            <LoginForm />
          </Card.Body>
        </Card.Root>
      </Stack>
    </Flex>
  )
}
