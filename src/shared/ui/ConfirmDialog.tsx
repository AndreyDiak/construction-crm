import { Button, Dialog, Portal, Text } from '@chakra-ui/react'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  isLoading?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Удалить',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.subtle"
            boxShadow="0 24px 60px rgba(28, 35, 35, 0.14)"
          >
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text color="gray.600" lineHeight="1.6">
                {description}
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button colorPalette="red" onClick={onConfirm} loading={isLoading}>
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
