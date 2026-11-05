import { Skeleton, Stack } from '@chakra-ui/react'

type LoadingStateProps = {
  rows?: number
}

export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <Stack gap="3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height="96px" borderRadius="lg" />
      ))}
    </Stack>
  )
}
