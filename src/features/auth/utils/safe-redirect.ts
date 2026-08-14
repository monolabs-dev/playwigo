const FALLBACK = '/'

export function getSafeRedirect(redirect: string | undefined) {
  if (!redirect) {
    return FALLBACK
  }

  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return FALLBACK
  }

  return redirect
}
