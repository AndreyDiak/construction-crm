import { Alert, Button, HStack } from '@chakra-ui/react'
import { RefreshCw } from 'lucide-react'
import { getErrorMessage } from '@/shared/lib/errors'

type ErrorStateProps = {
  error: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Alert.Root status="error" variant="subtle" borderRadius="xl" borderWidth="1px" borderColor="red.100">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Не удалось загрузить данные</Alert.Title>
        <Alert.Description>{getErrorMessage(error)}</Alert.Description>
        {onRetry && (
          <HStack mt="3">
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw size={14} />
              Повторить
            </Button>
          </HStack>
        )}
      </Alert.Content>
    </Alert.Root>
  )
}
