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
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { authClient } from '#/lib/auth-client.ts'
import type { CreatedApiKey } from '#/features/api-keys/types/api-key.ts'

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (apiKey: CreatedApiKey) => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      const result = await authClient.apiKey.create({
        name: trimmed,
      })

      if (result.error || !result.data) {
        setError(result.error?.message ?? 'Unable to create API key')
        return
      }

      onCreated(result.data as CreatedApiKey)
      setName('')
      onOpenChange(false)
      toast.success('API key created')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to create API key. Try again.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setName('')
          setError(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>
            Keys use the <span className="font-mono">sk-pwg-</span> prefix and
            can authenticate the CLI and agents via the{' '}
            <span className="font-mono">x-api-key</span> header.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="api-key-name">Name</Label>
          <Input
            id="api-key-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="cli-agent"
            autoFocus
            disabled={isCreating}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleCreate()
              }
            }}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={isCreating || name.trim().length === 0}
            onClick={() => void handleCreate()}
          >
            {isCreating ? 'Creating…' : 'Create key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
