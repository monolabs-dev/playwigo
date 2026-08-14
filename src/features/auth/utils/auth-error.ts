const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Email or password is incorrect.',
  USER_NOT_FOUND: 'Email or password is incorrect.',
  CREDENTIAL_ACCOUNT_NOT_FOUND: 'Email or password is incorrect.',
  INVALID_PASSWORD: 'Email or password is incorrect.',
  USER_ALREADY_EXISTS: 'An account with this email already exists.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'An account with this email already exists.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
  PASSWORD_TOO_LONG: 'Password is too long.',
  INVALID_EMAIL: 'Enter a valid email.',
  PROVIDER_NOT_FOUND: 'Google sign-in is not configured yet.',
}

const messageAliases: Record<string, string> = {
  'invalid email or password': messages.INVALID_EMAIL_OR_PASSWORD,
  'user not found': messages.USER_NOT_FOUND,
  'invalid password': messages.INVALID_PASSWORD,
  'user already exists.': messages.USER_ALREADY_EXISTS,
  'user already exists. use another email.':
    messages.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL,
  'invalid email': messages.INVALID_EMAIL,
  'password too short': messages.PASSWORD_TOO_SHORT,
  'password too long': messages.PASSWORD_TOO_LONG,
}

type AuthErrorLike = {
  code?: unknown
  message?: unknown
  status?: unknown
  statusText?: unknown
  error?: unknown
  cause?: unknown
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function isHttpStatusMessage(value: string | undefined) {
  if (!value) {
    return false
  }

  const normalized = value.trim().toLowerCase()

  return (
    normalized === 'unauthorized' ||
    normalized === 'forbidden' ||
    normalized === 'bad request' ||
    normalized === 'internal server error' ||
    /^\d{3}$/.test(normalized)
  )
}

type FlattenedAuthError = {
  code?: string
  message?: string
  status?: number
}

function flattenAuthError(
  error: unknown,
  seen = new Set<unknown>(),
): FlattenedAuthError {
  if (error == null || seen.has(error)) {
    return {}
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  if (typeof error !== 'object') {
    return {}
  }

  seen.add(error)

  const current = error as AuthErrorLike
  const nested = flattenAuthError(current.error, seen)
  const cause = flattenAuthError(current.cause, seen)
  const ownMessage = readString(current.message)
  const statusText = readString(current.statusText)

  return {
    code: nested.code ?? readString(current.code) ?? cause.code,
    message:
      nested.message ??
      (isHttpStatusMessage(ownMessage) ? undefined : ownMessage) ??
      cause.message ??
      (isHttpStatusMessage(statusText) ? undefined : statusText),
    status:
      typeof current.status === 'number'
        ? current.status
        : (nested.status ?? cause.status),
  }
}

export function getAuthErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Try again.',
) {
  const flattened = flattenAuthError(error)

  if (flattened.code && messages[flattened.code]) {
    return messages[flattened.code]
  }

  const aliased =
    flattened.message && messageAliases[flattened.message.trim().toLowerCase()]

  if (aliased) {
    return aliased
  }

  if (flattened.status === 401) {
    return messages.INVALID_EMAIL_OR_PASSWORD
  }

  return flattened.message ?? fallback
}

export function getOAuthErrorMessage(error: string | undefined) {
  if (!error) {
    return null
  }

  if (error === 'access_denied') {
    return 'Google sign-in was cancelled.'
  }

  return 'Google sign-in failed. Try again.'
}
