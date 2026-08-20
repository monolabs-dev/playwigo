import { CliError, UsageError } from './output.js'

export type ApiClientOptions = {
  baseUrl: string
  apiKey: string
}

export type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

const DEFAULT_API_URL = 'https://playwigo.monolabs.workers.dev'

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

export function createClientFromEnv(): ApiClientOptions {
  const baseUrl = process.env.PLAYWIGO_API_URL ?? DEFAULT_API_URL
  const apiKey = process.env.PLAYWIGO_API_KEY

  if (!apiKey) {
    throw new UsageError(
      'Missing PLAYWIGO_API_KEY. Create a key in the app (prefix sk-pwg-) and export it.',
    )
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    apiKey,
  }
}

export async function apiRequest<T>(
  client: ApiClientOptions,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${client.baseUrl}${path}`

  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      'x-api-key': client.apiKey,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let parsed: unknown = null

  if (text.length > 0) {
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new CliError(
        `Invalid JSON response from ${method} ${path} (${response.status})`,
      )
    }
  }

  if (!response.ok) {
    const err = parsed as ApiErrorBody | null
    const message =
      err?.error?.message ??
      `Request failed: ${method} ${path} (${response.status})`
    throw new CliError(message)
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    (parsed as { data: T }).data !== undefined
  ) {
    return (parsed as { data: T }).data
  }

  return parsed as T
}
