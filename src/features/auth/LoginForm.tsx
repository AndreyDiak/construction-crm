import { Alert, Button, Field, Input, Stack } from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage } from '@/shared/lib/errors'
import { signInWithPassword } from './api'
import { loginSchema, type LoginValues } from './login.schema'

export function LoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await signInWithPassword(values.email, values.password)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="5">
        {submitError && (
          <Alert.Root status="error" variant="subtle" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Не удалось войти</Alert.Title>
              <Alert.Description>{submitError}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <Field.Root invalid={Boolean(errors.email)}>
          <Field.Label color="gray.700">Email</Field.Label>
          <Input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="name@company.ru"
            size="lg"
            bg="bg.surface"
            borderColor="border.subtle"
            _hover={{ borderColor: 'border.muted' }}
          />
          <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={Boolean(errors.password)}>
          <Field.Label color="gray.700">Пароль</Field.Label>
          <Input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            size="lg"
            bg="bg.surface"
            borderColor="border.subtle"
            _hover={{ borderColor: 'border.muted' }}
          />
          <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
        </Field.Root>

        <Button
          type="submit"
          colorPalette="brand"
          size="lg"
          loading={isSubmitting}
          mt="1"
        >
          Войти
        </Button>
      </Stack>
    </form>
  )
}
