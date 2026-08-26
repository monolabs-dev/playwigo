import { ChevronLeft, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AppHeaderProps = {
  title: string
  subtitle?: string | null
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  actions,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex items-start gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur',
        className,
      )}
    >
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="Back"
          className="mt-0.5"
        >
          <ChevronLeft />
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-sm font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  )
}

export function ExternalLinkButton({
  href,
  label = 'Open in Playwigo',
}: {
  href: string
  label?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => {
        void browser.tabs.create({ url: href })
      }}
    >
      <ExternalLink />
      {label}
    </Button>
  )
}
