/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Loader2, Puzzle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import {
  AuthLayout,
  authCtaClass,
} from '#/features/auth/components/auth-layout.tsx'
import type { CreatedApiKey } from '#/features/api-keys/types/api-key.ts'
import { authClient } from '#/lib/auth-client.ts'
import { cn } from '#/lib/utils.ts'

type ConnectStatus = 'idle' | 'authorizing' | 'connected' | 'error'

function sendAuthToExtension(message: {
  type: 'EXTENSION_AUTH'
  state: string
  apiKey: string
  apiUrl: string
  extensionId: string
}): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const runtime = (
      globalThis as {
        chrome?: {
          runtime?: {
            sendMessage: (
              extensionId: string,
              msg: unknown,
              callback?: (response: unknown) => void,
            ) => void
            lastError?: { message?: string }
          }
        }
      }
    ).chrome?.runtime

    if (!runtime?.sendMessage) {
      resolve({
        ok: false,
        error:
          'Open this page from the Playwigo browser extension to finish connecting.',
      })
      return
    }

    try {
      runtime.sendMessage(
        message.extensionId,
        {
          type: message.type,
          state: message.state,
          apiKey: message.apiKey,
          apiUrl: message.apiUrl,
        },
        (response) => {
          const lastError = runtime.lastError
          if (lastError?.message) {
            resolve({ ok: false, error: lastError.message })
            return
          }
          const parsed = response as { ok?: boolean; error?: string } | undefined
          if (parsed?.ok) {
            resolve({ ok: true })
            return
          }
          resolve({
            ok: false,
            error: parsed?.error ?? 'Extension did not accept the connection.',
          })
        },
      )
    } catch (caught) {
      resolve({
        ok: false,
        error:
          caught instanceof Error
            ? caught.message
            : 'Unable to reach the extension.',
      })
    }
  })
}

export function ExtensionConnectPage({
  state,
  extensionId,
}: {
  state: string
  extensionId: string
}) {
  const [status, setStatus] = useState<ConnectStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleAuthorize() {
    setError(null)
    setStatus('authorizing')

    try {
      const result = await authClient.apiKey.create({
        name: 'Browser extension',
      })

      if (result.error || !result.data) {
        setStatus('error')
        setError(result.error?.message ?? 'Unable to create API key')
        return
      }

      const created = result.data as CreatedApiKey
      const handoff = await sendAuthToExtension({
        type: 'EXTENSION_AUTH',
        state,
        apiKey: created.key,
        apiUrl: window.location.origin,
        extensionId,
      })

      if (!handoff.ok) {
        setStatus('error')
        setError(handoff.error ?? 'Unable to reach the extension')
        toast.error(
          'Key was created, but the extension did not receive it. Use Settings → API Keys if needed.',
        )
        return
      }

      setStatus('connected')
      toast.success('Extension connected')
    } catch (caught) {
      setStatus('error')
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to authorize the extension.',
      )
    }
  }

  if (status === 'connected') {
    return (
      <AuthLayout
        kicker="Browser extension"
        title="You're connected"
        description="You can close this tab and return to the Playwigo side panel."
        footer={
          <p className="text-center text-sm text-muted-foreground">
            Manage keys anytime in{' '}
            <Link
              to="/settings/api-keys"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Settings → API Keys
            </Link>
            .
          </p>
        }
      >
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
          <p className="text-sm text-muted-foreground">
            The recorder extension is signed in with a new API key named
            “Browser extension”.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      kicker="Browser extension"
      title="Connect Playwigo Recorder"
      description="Allow the browser extension to browse your projects and record test case steps."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Not expecting this? Close the tab. You can revoke keys in{' '}
          <Link
            to="/settings/api-keys"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Settings → API Keys
          </Link>
          .
        </p>
      }
    >
      <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Puzzle className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">Playwigo Recorder</p>
            <p className="text-sm text-muted-foreground">
              This creates an API key for the extension (same as Settings → API
              Keys) and sends it securely to the side panel. The key is never
              shown in the URL.
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          className={cn(authCtaClass)}
          disabled={status === 'authorizing'}
          onClick={() => void handleAuthorize()}
        >
          {status === 'authorizing' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {status === 'authorizing' ? 'Connecting…' : 'Authorize extension'}
        </Button>
      </div>
    </AuthLayout>
  )
}
