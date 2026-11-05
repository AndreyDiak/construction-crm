import { Button, Center, Heading, Stack, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Center minH="100vh" className="login-atmosphere" position="relative" px="4">
      <Stack
        align="center"
        gap="4"
        textAlign="center"
        position="relative"
        zIndex="1"
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="2xl"
        px="8"
        py="10"
        maxW="md"
        boxShadow="0 18px 50px rgba(28, 35, 35, 0.06)"
      >
        <Heading size="4xl" color="gray.200" letterSpacing="-0.04em">
          404
        </Heading>
        <Heading size="lg" color="gray.900">
          Страница не найдена
        </Heading>
        <Text color="gray.600">Проверьте адрес или вернитесь на главную.</Text>
        <Button asChild colorPalette="brand">
          <Link to="/">На главную</Link>
        </Button>
      </Stack>
    </Center>
  )
}
