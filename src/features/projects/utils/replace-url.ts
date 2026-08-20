import type { StepConfigJson } from '#/features/test-cases/types/step-config.ts'
import { asStepConfigJson } from '#/features/test-cases/types/step-config.ts'

export function replaceUrlInString(
  value: string,
  fromUrl: string,
  toUrl: string,
): string {
  if (!fromUrl || fromUrl === toUrl) {
    return value
  }

  let result = value

  if (result.includes(fromUrl)) {
    result = result.split(fromUrl).join(toUrl)
  }

  try {
    const from = new URL(fromUrl)
    const to = new URL(toUrl)
    const fromOrigin = from.origin
    const toOrigin = to.origin

    if (fromOrigin !== toOrigin && result.includes(fromOrigin)) {
      result = result.split(fromOrigin).join(toOrigin)
    }
  } catch {
    return result
  }

  return result
}

export function maybeReplaceUrl(
  value: string | null | undefined,
  fromUrl: string,
  toUrl: string,
  enabled: boolean,
): string | null | undefined {
  if (!enabled || !value) {
    return value
  }

  return replaceUrlInString(value, fromUrl, toUrl)
}

export function replaceUrlInStepValue(
  action: string,
  value: string | null | undefined,
  fromUrl: string,
  toUrl: string,
  enabled: boolean,
): string | null | undefined {
  if (!enabled || !value) {
    return value
  }

  if (action === 'goto' || action === 'expectToHaveUrl') {
    return replaceUrlInString(value, fromUrl, toUrl)
  }

  return value
}

export function replaceUrlInStepConfig(
  action: string,
  config: unknown,
  fromUrl: string,
  toUrl: string,
  enabled: boolean,
): StepConfigJson {
  const parsed = asStepConfigJson(config)

  if (!enabled || !parsed) {
    return parsed
  }

  if (action === 'httpRequest' && 'url' in parsed && typeof parsed.url === 'string') {
    const next = { ...parsed, url: replaceUrlInString(parsed.url, fromUrl, toUrl) }

    if (typeof next.body === 'string') {
      next.body = replaceUrlInString(next.body, fromUrl, toUrl)
    }

    if (next.headers && typeof next.headers === 'object') {
      next.headers = Object.fromEntries(
        Object.entries(next.headers).map(([key, headerValue]) => [
          key,
          typeof headerValue === 'string'
            ? replaceUrlInString(headerValue, fromUrl, toUrl)
            : headerValue,
        ]),
      )
    }

    return next
  }

  if (action === 'setVariable' && 'value' in parsed && typeof parsed.value === 'string') {
    return {
      ...parsed,
      value: replaceUrlInString(parsed.value, fromUrl, toUrl),
    }
  }

  return parsed
}
