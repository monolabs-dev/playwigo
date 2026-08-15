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
import { TestCaseForm } from '#/features/test-cases/components/test-case-form.tsx'
import type { TestCaseSummary } from '#/features/test-cases/types/test-case.ts'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

export function TestCaseDialog({
  open,
  onOpenChange,
  mode,
  featureId,
  defaultBaseUrl,
  testAccounts,
  testCase,
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  featureId: string
  defaultBaseUrl: string
  testAccounts: TestAccountSummary[]
  testCase?: TestCaseSummary
  onSubmitted: (testCase: TestCaseSummary) => void
}) {
  const isCreate = mode === 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Add test case' : 'Edit test case'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Define a scenario Playwright can run for this feature.'
              : 'Update how this test case is configured.'}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <TestCaseForm
            mode={mode}
            featureId={featureId}
            defaultBaseUrl={defaultBaseUrl}
            testAccounts={testAccounts}
            testCase={testCase}
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
                  form="test-case-form"
                  disabled={isSubmitting}
                  className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
                >
                  {isSubmitting
                    ? isCreate
                      ? 'Adding test case…'
                      : 'Saving changes…'
                    : isCreate
                      ? 'Add test case'
                      : 'Save changes'}
                </Button>
              </DialogFooter>
            )}
          </TestCaseForm>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
