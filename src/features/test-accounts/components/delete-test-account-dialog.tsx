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
import { deleteTestAccount } from '#/features/test-accounts/server/test-accounts.ts'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

export function DeleteTestAccountDialog({
  account,
  open,
  onOpenChange,
  onDeleted,
}: {
  account: TestAccountSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (account: TestAccountSummary) => void
}) {
  const router = useRouter()
  const deleteFn = useServerFn(deleteTestAccount)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!account) {
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      await deleteFn({ data: { id: account.id } })
      onDeleted(account)
      onOpenChange(false)
      await router.invalidate({ sync: true })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to delete test account. Try again.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete test account</DialogTitle>
          <DialogDescription>
            {account
              ? `“${account.name}” will be removed. Test cases linked to this account will keep running without it.`
              : 'This test account will be removed from the project.'}
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
            disabled={isDeleting || !account}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
