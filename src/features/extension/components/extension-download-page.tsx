import { Link } from '@tanstack/react-router'
import { ArrowLeft, BugPlay, Download, Puzzle } from 'lucide-react'

import { ModeToggle } from '#/components/mode-toggle.tsx'
import { PageShell } from '#/components/page-shell.tsx'
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
import {
  extensionReleases,
  getLatestExtensionRelease,
} from '#/features/extension/data/releases.ts'
import {
  AuthHeaderActions

} from '#/integrations/better-auth/header-user.tsx'
import type {HeaderSession} from '#/integrations/better-auth/header-user.tsx';
import { cn } from '#/lib/utils.ts'

const ctaClass =
  'h-11 rounded-full px-5 text-[15px] transition-[transform,background-color,box-shadow,color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-0 active:scale-[0.97]'

const installSteps = [
  {
    title: 'Download the ZIP',
    description:
      'Use the download button above to save the latest Chrome build to your computer.',
  },
  {
    title: 'Extract the archive',
    description:
      'Unzip the file into a folder you can keep — Chrome loads the unpacked extension from that directory.',
  },
  {
    title: 'Open Chrome extensions',
    description:
      'Go to chrome://extensions or open Chrome menu → Extensions → Manage Extensions.',
  },
  {
    title: 'Enable Developer mode',
    description:
      'Turn on the Developer mode toggle in the top-right corner of the extensions page.',
  },
  {
    title: 'Load unpacked',
    description:
      'Click Load unpacked, then choose the folder you extracted from the ZIP file.',
  },
  {
    title: 'Connect to Playwigo',
    description:
      'Open the side panel, click Connect with Playwigo, and authorize the extension in your browser.',
  },
] as const

function formatReleaseDate(isoDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(`${isoDate}T00:00:00`))
}

export function ExtensionDownloadPage({ session }: { session: HeaderSession }) {
  const latest = getLatestExtensionRelease()

  return (
    <PageShell>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-heading text-sm font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_40%,black)]">
              <BugPlay className="size-4" />
            </span>
            Playwigo
          </Link>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <AuthHeaderActions initialSession={session} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 fine-hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="mt-8 max-w-3xl">
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
            Browser extension
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Playwigo Recorder for Chrome
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Record test case steps, pick elements on the page, and sync back to
            your Playwigo projects. The extension is not on the Chrome Web Store
            yet — install it manually using the build below.
          </p>
        </div>

        <section className="mt-10 rounded-3xl border border-primary/20 bg-primary/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Puzzle className="size-6" />
              </span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-semibold tracking-tight">
                    Latest release
                  </h2>
                  <Badge>v{latest.version}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {latest.notes ?? 'Chrome build for manual installation.'}
                </p>
              </div>
            </div>

            <Button size="lg" className={cn(ctaClass, 'shrink-0')} asChild>
              <a href={latest.downloadUrl} download={latest.fileName}>
                <Download className="size-4" />
                Download v{latest.version}
              </a>
            </Button>
          </div>
        </section>

        <section className="mt-14">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              All releases
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Download a specific version if you need to roll back or match an
              older build.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Version</TableHead>
                  <TableHead className="px-4">Released</TableHead>
                  <TableHead className="hidden px-4 md:table-cell">
                    Notes
                  </TableHead>
                  <TableHead className="px-4 text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extensionReleases.map((release, index) => (
                  <TableRow key={release.version}>
                    <TableCell className="px-4 font-medium">
                      <div className="flex items-center gap-2">
                        v{release.version}
                        {index === 0 ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Latest
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {formatReleaseDate(release.releasedAt)}
                    </TableCell>
                    <TableCell className="hidden max-w-sm truncate px-4 text-muted-foreground md:table-cell">
                      {release.notes ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={release.downloadUrl}
                          download={release.fileName}
                        >
                          <Download className="size-3.5" />
                          ZIP
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="mt-14">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Install in Chrome
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Because the extension is sideloaded, Chrome may show a “Disable
              extensions developer mode” banner — that is expected until we
              publish to the Web Store.
            </p>
          </div>

          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {installSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <p className="font-display text-2xl font-medium text-primary font-stretch-[80%]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-heading text-base font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-2xl border border-border bg-foreground/[0.02] p-5">
            <p className="text-sm text-muted-foreground">
              After updating, reload the extension on{' '}
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                chrome://extensions
              </code>{' '}
              so permission changes take effect.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <BugPlay className="size-4 text-primary" />
            <span>Playwigo — Playwright on the go</span>
          </div>
          <p>© 2026 Playwigo. All rights reserved.</p>
        </div>
      </footer>
    </PageShell>
  )
}
