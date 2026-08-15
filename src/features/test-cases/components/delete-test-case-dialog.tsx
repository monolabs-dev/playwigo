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
import { deleteTestCase } from '#/features/test-cases/server/test-cases.ts'
import type { TestCaseSummary } from '#/features/test-cases/types/test-case.ts'

export function DeleteTestCaseDialog({
  testCase,
  open,
  onOpenChange,
  onDeleted,
}: {
  testCase: TestCaseSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (testCase: TestCaseSummary) => void
}) {
  const router = useRouter()
  const deleteFn = useServerFn(deleteTestCase)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!testCase) {
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await deleteFn({ data: { id: testCase.id } })
      onDeleted(testCase)
      onOpenChange(false)
      await router.invalidate({ sync: true })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to delete test case. Try again.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const stepWarning =
    testCase && testCase.stepCount > 0
      ? ` This will also delete ${testCase.stepCount} step${testCase.stepCount === 1 ? '' : 's'}.`
      : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete test case</DialogTitle>
          <DialogDescription>
            {testCase
              ? `“${testCase.name}” will be removed from this feature.${stepWarning}`
              : 'This test case will be removed from the feature.'}
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
            disabled={isDeleting || !testCase}
            className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
            onClick={() => void handleDelete()}
          >
            {isDeleting ? 'Deleting…' : 'Delete test case'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
