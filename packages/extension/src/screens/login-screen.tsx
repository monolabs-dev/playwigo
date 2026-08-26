/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { createClient, listProjects, webAppUrl, ApiError  } from '@/api/client'
import { DEFAULT_API_URL } from '@/api/types'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  sendMessage


} from '@/lib/messaging'
import type {AuthConnectedMessage, ExtensionResponse} from '@/lib/messaging';
import { cn } from '@/lib/utils'

type LoginScreenProps = {
  onSuccess: () => void
  initialApiUrl?: string
}

export function LoginScreen({
  onSuccess,
  initialApiUrl = DEFAULT_API_URL,
}: LoginScreenProps) {
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState(initialApiUrl)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    const onMessage = (message: AuthConnectedMessage) => {
      if (message?.type === 'AUTH_CONNECTED') {
        setConnecting(false)
        toast.success('Connected')
        onSuccess()
      }
    }
    browser.runtime.onMessage.addListener(onMessage)
    return () => {
      browser.runtime.onMessage.removeListener(onMessage)
    }
  }, [onSuccess])

  useEffect(() => {
    void sendMessage<{
      ok: boolean
      data?: { pending: boolean }
    }>({ type: 'GET_CONNECT_STATUS' }).then((result) => {
      if (result.ok && result.data?.pending) {
        setConnecting(true)
      }
    })
  }, [])

  async function handleConnect() {
    setConnecting(true)
    const result = await sendMessage<ExtensionResponse>({
      type: 'START_CONNECT',
      apiUrl: apiUrl.trim() || DEFAULT_API_URL,
    })
    if (!result.ok) {
      setConnecting(false)
      toast.error(result.error ?? 'Unable to start connect')
      return
    }
    toast.message('Complete authorization in the Playwigo tab')
  }

  async function handleCancelConnect() {
    await sendMessage({ type: 'CANCEL_CONNECT' })
    setConnecting(false)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const key = apiKey.trim()
    if (!key) {
      toast.error('Paste an API key (sk-pwg-…)')
      return
    }

    setLoading(true)
    try {
      const client = createClient(key, apiUrl)
      await listProjects(client)
      const result = await sendMessage<{ ok: boolean; error?: string }>({
        type: 'SET_AUTH',
        apiKey: key,
        apiUrl: apiUrl.trim() || DEFAULT_API_URL,
      })
      if (!result.ok) {
        throw new Error(result.error ?? 'Failed to save credentials')
      }
      toast.success('Connected')
      onSuccess()
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Sign-in failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Playwigo" subtitle="Recorder extension" />
      <div className="flex flex-1 flex-col gap-4 px-3 py-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Connect with your Playwigo account to browse projects and record
            steps.
          </p>
          {connecting ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Waiting for authorization…
              </div>
              <p className="text-[11px] text-muted-foreground">
                Approve the request in the Playwigo tab that just opened.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => void handleCancelConnect()}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="w-full"
              onClick={() => void handleConnect()}
            >
              Connect with Playwigo
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="api-url">API URL</Label>
          <Input
            id="api-url"
            type="url"
            placeholder={DEFAULT_API_URL}
            value={apiUrl}
            disabled={connecting}
            onChange={(e) => setApiUrl(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Use the default for production, or{' '}
            <span className="font-mono">http://localhost:3000</span> for local
            dev.
          </p>
        </div>

        <div className="border-t border-border pt-2">
          <button
            type="button"
            className="flex w-full items-center justify-between py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            Advanced: paste API key
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform',
                showAdvanced && 'rotate-180',
              )}
            />
          </button>

          {showAdvanced ? (
            <form
              onSubmit={handleSubmit}
              className="mt-2 flex flex-col gap-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="api-key">API key</Label>
                <Input
                  id="api-key"
                  type="password"
                  autoComplete="off"
                  placeholder="sk-pwg-…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Create a key in Settings → API Keys if you prefer not to use
                  Connect.
                </p>
              </div>

              <Button type="submit" variant="outline" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                Connect with API key
              </Button>

              <button
                type="button"
                className="text-left text-xs text-primary underline-offset-2 hover:underline"
                onClick={() => {
                  void browser.tabs.create({
                    url: webAppUrl(
                      apiUrl || DEFAULT_API_URL,
                      '/settings/api-keys',
                    ),
                  })
                }}
              >
                Open Settings → API Keys
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
