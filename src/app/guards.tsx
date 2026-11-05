import { Button, Center, Spinner, Stack, Text } from '@chakra-ui/react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'

export function ProtectedRoute() {
  const { session, profile, isLoading, profileError, signOut } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Center minH="100vh" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Center>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <Center minH="100vh" bg="gray.50" px="4">
        <Stack align="center" gap="4" textAlign="center">
          <Text fontWeight="semibold" fontSize="lg">
            Не удалось загрузить профиль
          </Text>
          <Text color="gray.600">
            {profileError ?? 'Профиль пользователя не найден.'}
          </Text>
          <Button
            variant="outline"
            onClick={() => {
              void signOut().then(() => navigate('/login', { replace: true }))
            }}
          >
            Выйти
          </Button>
        </Stack>
      </Center>
    )
  }

  return <Outlet />
}

export function HomeRedirect() {
  const { profile } = useAuth()

  if (profile?.role === 'manager') {
    return <Navigate to="/objects" replace />
  }

  return <Navigate to="/my-tasks" replace />
}
