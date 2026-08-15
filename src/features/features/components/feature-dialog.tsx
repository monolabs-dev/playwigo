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
import { FeatureForm } from '#/features/features/components/feature-form.tsx'
import type { FeatureSummary } from '#/features/features/types/feature.ts'

export function FeatureDialog({
  open,
  onOpenChange,
  mode,
  projectId,
  feature,
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  projectId: string
  feature?: FeatureSummary
  onSubmitted: (feature: FeatureSummary) => void
}) {
  const isCreate = mode === 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Add feature' : 'Edit feature'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Organize test cases by the part of the product they cover.'
              : 'Update how this feature is labeled in your project.'}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <FeatureForm
            mode={mode}
            projectId={projectId}
            feature={feature}
            onSubmitted={(saved) => {
              onSubmitted(saved)
              onOpenChange(false)
            }}
          >
            {({ isSubmitting }) => (
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  form="feature-form"
                  disabled={isSubmitting}
                  className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
                >
                  {isSubmitting
                    ? isCreate
                      ? 'Adding feature…'
                      : 'Saving changes…'
                    : isCreate
                      ? 'Add feature'
                      : 'Save changes'}
                </Button>
              </DialogFooter>
            )}
          </FeatureForm>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
