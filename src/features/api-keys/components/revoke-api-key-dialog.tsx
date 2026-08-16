import { useState } from 'react'
import { toast } from 'sonner'

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
import { authClient } from '#/lib/auth-client.ts'
import type { ApiKeySummary } from '#/features/api-keys/types/api-key.ts'

export function RevokeApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
  onRevoked,
}: {
  apiKey: ApiKeySummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRevoked: (apiKey: ApiKeySummary) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  async function handleRevoke() {
    if (!apiKey) return

    setError(null)
    setIsRevoking(true)

    try {
      const result = await authClient.apiKey.delete({
        keyId: apiKey.id,
      })

      if (result.error) {
        setError(result.error.message ?? 'Unable to revoke API key')
        return
      }

      onRevoked(apiKey)
      onOpenChange(false)
      toast.success('API key revoked')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to revoke API key. Try again.',
      )
    } finally {
      setIsRevoking(false)
    }
  }

  const label = apiKey?.name?.trim() || 'Untitled key'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revoke API key</DialogTitle>
          <DialogDescription>
            “{label}” will stop working immediately for the CLI and any agents
            using it.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isRevoking}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isRevoking}
            onClick={() => void handleRevoke()}
          >
            {isRevoking ? 'Revoking…' : 'Revoke key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
