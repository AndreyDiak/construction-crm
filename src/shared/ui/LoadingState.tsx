import { Skeleton, Stack } from '@chakra-ui/react'

type LoadingStateProps = {
  rows?: number
}

export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <Stack gap="3.5">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          height="104px"
          borderRadius="xl"
          variant="pulse"
          css={{
            '--start-color': 'colors.gray.100',
            '--end-color': 'colors.gray.200',
          }}
        />
      ))}
    </Stack>
  )
}
