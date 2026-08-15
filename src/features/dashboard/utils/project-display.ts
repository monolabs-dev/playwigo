import type { ProjectHealth } from '#/features/dashboard/types/project.ts'

const MARK_TONES = [
  'bg-primary/15 text-primary',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  'bg-violet-500/15 text-violet-700 dark:text-violet-400',
] as const

export function websiteHost(website: string) {
  try {
    return new URL(website).host
  } catch {
    return website.replace(/^https?:\/\//, '')
  }
}

export function projectInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function projectMarkTone(id: string) {
  let hash = 0

  for (const char of id) {
    hash = (hash + char.charCodeAt(0)) % MARK_TONES.length
  }

  return MARK_TONES[hash] ?? MARK_TONES[0]
}

export function healthLabel(health: ProjectHealth) {
  switch (health) {
    case 'passing':
      return 'All clear'
    case 'failing':
      return 'Needs attention'
    case 'running':
      return 'Run in progress'
    case 'idle':
      return 'No recent runs'
  }
}

export function healthDotClass(health: ProjectHealth) {
  switch (health) {
    case 'passing':
      return 'bg-emerald-500'
    case 'failing':
      return 'bg-destructive'
    case 'running':
      return 'bg-primary animate-pulse'
    case 'idle':
      return 'bg-muted-foreground/40'
  }
}
