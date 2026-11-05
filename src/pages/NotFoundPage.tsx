import { Button, Center, Heading, Stack, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Center minH="100vh" bg="gray.50" px="4">
      <Stack align="center" gap="4" textAlign="center">
        <Heading size="4xl" color="gray.300">
          404
        </Heading>
        <Heading size="lg">Страница не найдена</Heading>
        <Text color="gray.600">Проверьте адрес или вернитесь на главную.</Text>
        <Button asChild colorPalette="blue">
          <Link to="/">На главную</Link>
        </Button>
      </Stack>
    </Center>
  )
}
