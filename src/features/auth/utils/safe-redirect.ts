export const DEFAULT_POST_AUTH_PATH = '/dashboard'

export function getSafeRedirect(redirect: string | undefined) {
  if (!redirect) {
    return DEFAULT_POST_AUTH_PATH
  }

  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return DEFAULT_POST_AUTH_PATH
  }

  return redirect
}
