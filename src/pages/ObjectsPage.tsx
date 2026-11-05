import { Button, SimpleGrid } from '@chakra-ui/react'
import { Building2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import { ObjectCard } from '@/entities/object/ObjectCard'
import type { ObjectListItem } from '@/entities/object/types'
import { useDeleteObject, useObjects } from '@/features/objects/hooks'
import { ObjectFormDialog } from '@/features/objects/ObjectFormDialog'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'

export function ObjectsPage() {
  const { profile } = useAuth()
  const objectsQuery = useObjects()
  const deleteMutation = useDeleteObject()

  const [formOpen, setFormOpen] = useState(false)
  const [editingObject, setEditingObject] = useState<ObjectListItem | null>(null)
  const [deletingObject, setDeletingObject] = useState<ObjectListItem | null>(null)

  const isManager = profile?.role === 'manager'

  const openCreate = () => {
    setEditingObject(null)
    setFormOpen(true)
  }

  const openEdit = (object: ObjectListItem) => {
    setEditingObject(object)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingObject) {
      return
    }

    try {
      await deleteMutation.mutateAsync(deletingObject.id)
      setDeletingObject(null)
    } catch {
      // Error toast is shown by the mutation hook.
    }
  }

  return (
    <>
      <PageHeader
        title="Объекты"
        description={
          isManager
            ? 'Управляйте строительными объектами и задачами на них.'
            : 'Объекты, по которым у вас есть назначенные задачи.'
        }
        actions={
          isManager ? (
            <Button colorPalette="blue" onClick={openCreate}>
              <Plus size={16} />
              Создать объект
            </Button>
          ) : undefined
        }
      />

      {objectsQuery.isLoading && <LoadingState rows={4} />}

      {objectsQuery.isError && (
        <ErrorState error={objectsQuery.error} onRetry={() => void objectsQuery.refetch()} />
      )}

      {objectsQuery.isSuccess && objectsQuery.data.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Объектов пока нет"
          description={
            isManager
              ? 'Создайте первый объект, чтобы начать ставить задачи.'
              : 'Как только постановщик назначит вам задачу, объект появится здесь.'
          }
          action={
            isManager ? (
              <Button colorPalette="blue" onClick={openCreate}>
                <Plus size={16} />
                Создать объект
              </Button>
            ) : undefined
          }
        />
      )}

      {objectsQuery.isSuccess && objectsQuery.data.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {objectsQuery.data.map((object) => (
            <ObjectCard
              key={object.id}
              object={object}
              isManager={isManager}
              onEdit={openEdit}
              onDelete={setDeletingObject}
            />
          ))}
        </SimpleGrid>
      )}

      <ObjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        object={editingObject}
      />

      <ConfirmDialog
        open={Boolean(deletingObject)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingObject(null)
          }
        }}
        title="Удалить объект?"
        description={`Объект «${deletingObject?.name ?? ''}» будет скрыт. История задач сохранится.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          void handleDelete()
        }}
      />
    </>
  )
}
