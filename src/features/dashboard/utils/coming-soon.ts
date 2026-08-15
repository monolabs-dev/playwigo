import { toast } from 'sonner'

export function comingSoon(label: string) {
  toast('Coming soon', {
    description: `${label} isn’t ready yet.`,
  })
}
