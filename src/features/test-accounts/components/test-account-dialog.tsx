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
import { TestAccountForm } from '#/features/test-accounts/components/test-account-form.tsx'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

export function TestAccountDialog({
  open,
  onOpenChange,
  mode,
  projectId,
  projectWebsite,
  account,
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  projectId: string
  projectWebsite: string
  account?: TestAccountSummary
  onSubmitted: (account: TestAccountSummary) => void
}) {
  const isCreate = mode === 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Add test account' : 'Edit test account'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Store credentials Playwright can reuse across test cases.'
              : 'Update saved credentials for this project.'}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <TestAccountForm
            mode={mode}
            projectId={projectId}
            projectWebsite={projectWebsite}
            account={account}
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
                  form="test-account-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? isCreate
                      ? 'Adding account…'
                      : 'Saving changes…'
                    : isCreate
                      ? 'Add account'
                      : 'Save changes'}
                </Button>
              </DialogFooter>
            )}
          </TestAccountForm>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
