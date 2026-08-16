import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import { CreateApiKeyDialog } from '#/features/api-keys/components/create-api-key-dialog.tsx'
import { RevealApiKeyDialog } from '#/features/api-keys/components/reveal-api-key-dialog.tsx'
import { RevokeApiKeyDialog } from '#/features/api-keys/components/revoke-api-key-dialog.tsx'
import type {
  ApiKeySummary,
  CreatedApiKey,
} from '#/features/api-keys/types/api-key.ts'
import { authClient } from '#/lib/auth-client.ts'

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function displayPrefix(apiKey: ApiKeySummary) {
  const prefix = apiKey.prefix ?? 'sk-pwg-'
  const start = apiKey.start ?? ''
  if (!start) return `${prefix}…`
  return `${prefix}${start}…`
}

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [revealedKey, setRevealedKey] = useState<CreatedApiKey | null>(null)
  const [revealOpen, setRevealOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeySummary | null>(null)

  const loadKeys = useCallback(async () => {
    setLoading(true)

    try {
      const result = await authClient.apiKey.list({
        query: {
          sortBy: 'createdAt',
          sortDirection: 'desc',
        },
      })

      if (result.error) {
        toast.error(result.error.message ?? 'Unable to load API keys')
        return
      }

      const payload = result.data as
        | { apiKeys?: ApiKeySummary[] }
        | ApiKeySummary[]
        | null
        | undefined

      const next = Array.isArray(payload)
        ? payload
        : (payload?.apiKeys ?? [])

      setKeys(next)
    } catch {
      toast.error('Unable to load API keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadKeys()
  }, [loadKeys])

  function handleCreated(apiKey: CreatedApiKey) {
    setKeys((current) => [apiKey, ...current])
    setRevealedKey(apiKey)
    setRevealOpen(true)
  }

  function openRevoke(apiKey: ApiKeySummary) {
    setKeyToRevoke(apiKey)
    setRevokeOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl space-y-1">
          <p className="text-sm text-muted-foreground">
            Create keys for the Playwigo CLI and AI agents. A leaked key can
            act as your full account — rotate keys if exposed.
          </p>
        </div>
        <Button
          className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          onClick={() => setCreateOpen(true)}
        >
          <Plus />
          Create key
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : keys.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <KeyRound className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">No API keys yet</CardTitle>
              <CardDescription>
                Create a key, then set{' '}
                <span className="font-mono text-xs">PLAYWIGO_API_KEY</span> and
                use{' '}
                <span className="font-mono text-xs">
                  pnpm run cli projects list --json
                </span>
                .
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus />
              Create key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">
                    {apiKey.name?.trim() || 'Untitled key'}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {displayPrefix(apiKey)}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(apiKey.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(apiKey.lastRequest)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openRevoke(apiKey)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateApiKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
      <RevealApiKeyDialog
        apiKey={revealedKey}
        open={revealOpen}
        onOpenChange={setRevealOpen}
      />
      <RevokeApiKeyDialog
        apiKey={keyToRevoke}
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        onRevoked={(revoked) => {
          setKeys((current) => current.filter((item) => item.id !== revoked.id))
        }}
      />
    </div>
  )
}
