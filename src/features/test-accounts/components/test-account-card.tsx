import { ExternalLink, Globe, Mail, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

export function TestAccountCard({
  account,
  index,
  onEdit,
  onDelete,
}: {
  account: TestAccountSummary
  index: number
  onEdit: (account: TestAccountSummary) => void
  onDelete: (account: TestAccountSummary) => void
}) {
  return (
    <Card
      className="h-full animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out-strong fill-mode-backwards motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <CardHeader className="border-b">
        <CardTitle className="truncate font-semibold">{account.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {account.description ?? 'No notes yet.'}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${account.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(account)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap gap-2">
          {account.email ? (
            <Badge variant="secondary" className="max-w-full gap-1.5 truncate">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{account.email}</span>
            </Badge>
          ) : (
            <Badge variant="outline">No email saved</Badge>
          )}
          {account.url ? (
            <Badge variant="secondary" className="max-w-full gap-1.5 truncate">
              <Globe className="size-3 shrink-0" />
              <span className="truncate">{formatHost(account.url)}</span>
            </Badge>
          ) : null}
        </div>

        {account.url ? (
          <a
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-150 ease-out-strong fine-hover:text-foreground"
          >
            Open login page
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  )
}

function formatHost(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
