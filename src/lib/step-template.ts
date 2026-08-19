const TOKEN_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g

const SENSITIVE_NAME_PATTERN = /otp|token|password|secret|code|key|auth/i

export const BUILTIN_TEMPLATE_TOKENS = [
  { token: '{{$uuid}}', description: 'Random UUID (memoized per run)' },
  { token: '{{$timestamp}}', description: 'Unix timestamp in milliseconds' },
  { token: '{{$isoDate}}', description: 'ISO-8601 date-time' },
  {
    token: '{{$randomInt(6)}}',
    description: 'Random digits of the given length',
  },
  {
    token: '{{$randomString(8)}}',
    description: 'Random alphanumeric string of the given length',
  },
  {
    token: '{{$email}}',
    description: 'Unique email (qa+<id>@playwigo.test)',
  },
  {
    token: '{{$email:example.com}}',
    description: 'Unique email with a custom domain',
  },
] as const

export type TemplateLookup = {
  getVariable: (name: string) => string | undefined
  getGenerator: (expression: string) => string
}

export function extractTemplateTokens(text: string | null | undefined) {
  if (!text) {
    return [] as string[]
  }

  const tokens = new Set<string>()
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const expression = match[1]?.trim()
    if (expression) {
      tokens.add(expression)
    }
  }

  return [...tokens]
}

export function isSensitiveVariableName(name: string) {
  return SENSITIVE_NAME_PATTERN.test(name)
}

export function maskSensitiveValue(value: string) {
  if (value.length <= 4) {
    return '••••'
  }

  return `${value.slice(0, 2)}${'•'.repeat(Math.min(value.length - 2, 8))}`
}

export function interpolate(
  text: string | null | undefined,
  lookup: TemplateLookup,
  options?: { stepIndex?: number },
) {
  if (text == null || text === '') {
    return text ?? null
  }

  return text.replace(TOKEN_PATTERN, (_match, rawExpression: string) => {
    const expression = rawExpression.trim()

    if (!expression) {
      throw new Error('Empty template token {{}} is not allowed')
    }

    if (expression.startsWith('$')) {
      return lookup.getGenerator(expression)
    }

    const value = lookup.getVariable(expression)
    if (value === undefined) {
      const stepHint =
        options?.stepIndex !== undefined
          ? ` before step ${options.stepIndex + 1}`
          : ''
      throw new Error(
        `Variable "${expression}" is not defined yet. Add a step that produces it${stepHint}, or pass it when starting the run.`,
      )
    }

    return value
  })
}

function randomDigits(length: number) {
  const chars = '0123456789'
  let result = ''
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  for (const byte of bytes) {
    result += chars[byte % chars.length]
  }
  return result
}

function randomAlphanumeric(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  for (const byte of bytes) {
    result += chars[byte % chars.length]
  }
  return result
}

export function evaluateGeneratorExpression(expression: string): string {
  if (expression === '$uuid') {
    return crypto.randomUUID()
  }

  if (expression === '$timestamp') {
    return String(Date.now())
  }

  if (expression === '$isoDate') {
    return new Date().toISOString()
  }

  if (expression === '$email') {
    return `qa+${crypto.randomUUID().slice(0, 8)}@playwigo.test`
  }

  const emailMatch = /^\$email:(.+)$/.exec(expression)
  if (emailMatch) {
    const domain = emailMatch[1]?.trim()
    if (!domain) {
      throw new Error('{{$email:domain}} requires a domain')
    }
    return `qa+${crypto.randomUUID().slice(0, 8)}@${domain}`
  }

  const intMatch = /^\$randomInt\((\d+)\)$/.exec(expression)
  if (intMatch) {
    const length = Number(intMatch[1])
    if (!Number.isFinite(length) || length < 1 || length > 32) {
      throw new Error('{{$randomInt(n)}} requires n between 1 and 32')
    }
    return randomDigits(length)
  }

  const stringMatch = /^\$randomString\((\d+)\)$/.exec(expression)
  if (stringMatch) {
    const length = Number(stringMatch[1])
    if (!Number.isFinite(length) || length < 1 || length > 64) {
      throw new Error('{{$randomString(n)}} requires n between 1 and 64')
    }
    return randomAlphanumeric(length)
  }

  throw new Error(`Unknown generator token {{${expression}}}`)
}
