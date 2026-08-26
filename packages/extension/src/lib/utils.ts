import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function newClientId() {
  return crypto.randomUUID()
}

export function projectFaviconUrl(website: string | null | undefined) {
  if (!website) return null
  try {
    const host = new URL(website).hostname
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
  } catch {
    return null
  }
}
