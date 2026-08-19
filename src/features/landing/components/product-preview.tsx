import {
  BugPlay,
  Check,
  ChevronsUpDown,
  Circle,
  CirclePlay,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Loader2,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Settings,
} from 'lucide-react'

import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import { cn } from '#/lib/utils.ts'

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, active: false },
  { title: 'Features', icon: FolderKanban, active: true },
  { title: 'Authentication', icon: KeyRound, active: false },
  { title: 'Test runs', icon: CirclePlay, active: false },
] as const

const testCases = [
  {
    name: 'Cart with two items',
    steps: 4,
    status: 'passed',
    duration: '12.4 s',
    lastRun: 'Aug 19, 1:12 PM',
  },
  {
    name: 'Apply promo code SAVE20',
    steps: 6,
    status: 'passed',
    duration: '8.1 s',
    lastRun: 'Aug 19, 1:14 PM',
  },
  {
    name: 'Tax for a US address',
    steps: 5,
    status: 'passed',
    duration: '9.6 s',
    lastRun: 'Aug 19, 1:16 PM',
  },
  {
    name: 'Submit order and show confirmation',
    steps: 8,
    status: 'running',
    duration: '—',
    lastRun: '—',
  },
] as const

type PreviewStatus = (typeof testCases)[number]['status']

export function ProductPreview() {
  return (
    <div className="animate-lp-preview relative delay-200" aria-hidden>
      <div
        className="pointer-events-none absolute -inset-x-16 -inset-y-10 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_68%)]"
      />

      <div className="pointer-events-none relative overflow-hidden rounded-2xl border border-border/80 bg-sidebar shadow-[0_24px_80px_-32px_oklch(0.2_0.04_50/0.45)]">
        <div className="flex min-h-88 md:min-h-104">
          <PreviewSidebar />
          <PreviewMain />
        </div>
      </div>
    </div>
  )
}

function PreviewSidebar() {
  return (
    <aside className="hidden w-55 shrink-0 flex-col p-2 md:flex">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BugPlay className="size-3.5" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Playwigo</span>
      </div>

      <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-muted px-2 py-1.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
          AS
        </span>
        <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">Acme Store</span>
          <span className="truncate text-xs text-muted-foreground">
            acme.store
          </span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </div>

      <p className="mt-3 flex h-8 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
        Workspace
      </p>
      <ul className="mt-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <li key={item.title}>
            <span
              className={cn(
                'flex h-8 items-center gap-2 rounded-md px-2 text-sm',
                item.active
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.title}
            </span>
          </li>
        ))}
      </ul>

      <div className="my-3 h-px bg-sidebar-border" />

      <p className="flex h-8 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
        Project
      </p>
      <span className="mt-1 flex h-8 items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground">
        <Settings className="size-4 shrink-0" />
        Settings
      </span>

      <div className="mt-auto flex items-center gap-2 rounded-lg px-2 py-1.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
          M
        </span>
        <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">Maya Chen</span>
          <span className="truncate text-xs text-muted-foreground">
            maya@acme.store
          </span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </div>
    </aside>
  )
}

function PreviewMain() {
  return (
    <div className="m-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm md:ml-0">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/70 px-3">
        <PanelLeft className="size-4 text-muted-foreground" />
        <span className="h-4 w-px bg-border" />
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          Acme Store
          <span className="mx-1.5 text-border">/</span>
          <span className="text-foreground">Feature</span>
        </p>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm text-muted-foreground">
            <Search className="size-3.5" />
            Switch project
            <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </span>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
            <CirclePlay className="size-4" />
            Run
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">
              Checkout
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              Cart through confirmation for the storefront.
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <Button variant="outline" size="sm" tabIndex={-1}>
              <CirclePlay />
              Run all
            </Button>
            <Button size="sm" tabIndex={-1}>
              <Plus />
              Add test case
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 pl-4">Test case</TableHead>
                <TableHead className="hidden w-16 sm:table-cell">
                  Steps
                </TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="hidden w-24 md:table-cell">
                  Duration
                </TableHead>
                <TableHead className="hidden w-36 lg:table-cell">
                  Last run
                </TableHead>
                <TableHead className="w-12 pr-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testCases.map((testCase, index) => (
                <TableRow
                  key={testCase.name}
                  className="animate-lp-enter hover:bg-transparent"
                  style={{ animationDelay: `${280 + index * 70}ms` }}
                >
                  <TableCell className="max-w-0 pl-4 font-medium">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <StatusIcon status={testCase.status} />
                      <span className="truncate">
                        {testCase.status === 'running' ? (
                          <span className="text-muted-foreground">
                            Running {testCase.name}…
                          </span>
                        ) : (
                          testCase.name
                        )}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                    {testCase.steps}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={testCase.status} />
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                    {testCase.duration}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {testCase.lastRun}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: PreviewStatus }) {
  if (status === 'running') {
    return (
      <Loader2
        className="size-4 shrink-0 animate-spin text-primary motion-reduce:animate-none"
        aria-hidden
      />
    )
  }

  return (
    <Check
      className="size-4 shrink-0 text-emerald-500"
      strokeWidth={2.5}
      aria-hidden
    />
  )
}

function StatusBadge({ status }: { status: PreviewStatus }) {
  const passed = status === 'passed'

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-normal',
        passed
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-primary/30 bg-primary/10 text-primary',
      )}
    >
      {passed ? (
        <Check className="size-3" />
      ) : (
        <Circle className="size-2.5 fill-current stroke-none" />
      )}
      {passed ? 'Passed' : 'Running'}
    </Badge>
  )
}
