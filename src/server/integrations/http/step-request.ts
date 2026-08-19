/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
]

const MAX_RESPONSE_BYTES = 256_000
const DEFAULT_TIMEOUT_MS = 10_000

export type StepHttpRequestInput = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers?: Record<string, string> | null
  body?: string | null
  jsonPath?: string | null
  regex?: string | null
  expectStatus?: number | null
  retry?: {
    attempts: number
    intervalMs: number
  } | null
}

function assertSafeUrl(rawUrl: string) {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed')
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')

  if (
    PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname)) ||
    isPrivateIpv4(hostname)
  ) {
    throw new Error('Requests to private or loopback hosts are not allowed')
  }

  return parsed
}

function isPrivateIpv4(hostname: string) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (!match) {
    return false
  }

  const octets = match.slice(1).map(Number)
  if (octets.some((octet) => octet > 255)) {
    return true
  }

  const [a, b] = octets
  if (a === undefined || b === undefined) {
    return false
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true
  }

  if (a === 100 && b >= 64 && b <= 127) {
    return true
  }

  return false
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readJsonPath(payload: unknown, path: string): unknown {
  const normalized = path.trim().replace(/^\$\.?/, '')
  if (!normalized) {
    return payload
  }

  const parts = normalized
    .split('.')
    .flatMap((part) => {
      const matches = [...part.matchAll(/([^[\]]+)|\[(\d+)\]/g)]
      if (matches.length === 0) {
        return [part]
      }
      return matches.map((match) => match[1] ?? match[2]!).filter(Boolean)
    })
    .filter((part) => part.length > 0)

  let current: unknown = payload
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }

    if (Array.isArray(current)) {
      const index = Number(part)
      if (!Number.isInteger(index)) {
        return undefined
      }
      current = current[index]
      continue
    }

    current = (current as Record<string, unknown>)[part]
  }

  return current
}

function applyRegex(raw: string, pattern: string) {
  const match = new RegExp(pattern).exec(raw)
  if (!match) {
    throw new Error(`Regex did not match response: /${pattern}/`)
  }

  return match[1] ?? match[0]
}

function valueToString(value: unknown) {
  if (value == null) {
    throw new Error('Extracted value is empty')
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}

async function executeOnce(input: StepHttpRequestInput) {
  const url = assertSafeUrl(input.url)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(url.toString(), {
      method: input.method,
      headers: input.headers ?? undefined,
      body:
        input.method === 'GET' || input.method === 'DELETE'
          ? undefined
          : (input.body ?? undefined),
      redirect: 'manual',
      signal: controller.signal,
    })

    if (input.expectStatus != null && response.status !== input.expectStatus) {
      throw new Error(
        `Expected status ${input.expectStatus}, got ${response.status}`,
      )
    }

    if (response.status >= 300 && response.status < 400) {
      throw new Error(
        `Redirect responses are not followed (status ${response.status})`,
      )
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error(
        `Response too large (${buffer.byteLength} bytes, max ${MAX_RESPONSE_BYTES})`,
      )
    }

    const text = new TextDecoder().decode(buffer)

    if (input.jsonPath) {
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error('Response is not valid JSON')
      }

      const extracted = readJsonPath(json, input.jsonPath)
      if (extracted === undefined) {
        throw new Error(`JSON path "${input.jsonPath}" not found`)
      }

      const asString = valueToString(extracted)
      if (input.regex) {
        return applyRegex(asString, input.regex)
      }
      return asString
    }

    if (input.regex) {
      return applyRegex(text, input.regex)
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`)
    }

    return text.trim()
  } finally {
    clearTimeout(timeout)
  }
}

export async function executeStepHttpRequest(input: StepHttpRequestInput) {
  const attempts = input.retry?.attempts ?? 1
  const intervalMs = input.retry?.intervalMs ?? 1000
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await executeOnce(input)
    } catch (error) {
      lastError = error
      if (attempt >= attempts) {
        break
      }
      await sleep(intervalMs)
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : 'HTTP request failed'
  throw new Error(message)
}
