import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { Button } from '#/components/ui/button.tsx'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { deleteFeature } from '#/features/features/server/features.ts'
import type { FeatureSummary } from '#/features/features/types/feature.ts'

export function DeleteFeatureDialog({
  feature,
  open,
  onOpenChange,
  onDeleted,
}: {
  feature: FeatureSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (feature: FeatureSummary) => void
}) {
  const router = useRouter()
  const deleteFn = useServerFn(deleteFeature)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!feature) {
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await deleteFn({ data: { id: feature.id } })
      onDeleted(feature)
      onOpenChange(false)
      await router.invalidate({ sync: true })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to delete feature. Try again.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const caseWarning =
    feature && feature.testCaseCount > 0
      ? ` This will also delete ${feature.testCaseCount} test case${feature.testCaseCount === 1 ? '' : 's'}.`
      : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete feature</DialogTitle>
          <DialogDescription>
            {feature
              ? `“${feature.name}” will be removed from this project.${caseWarning}`
              : 'This feature will be removed from the project.'}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting || !feature}
            className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
            onClick={() => void handleDelete()}
          >
            {isDeleting ? 'Deleting…' : 'Delete feature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
