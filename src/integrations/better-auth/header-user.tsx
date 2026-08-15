import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { cn } from '#/lib/utils.ts'
import { authClient } from '#/lib/auth-client.ts'

const ctaClass =
  'h-11 rounded-full px-5 text-[15px] transition-[transform,background-color,box-shadow,color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-0 active:scale-[0.97]'

export function AuthHeaderActions() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden h-9 w-16 animate-pulse rounded-full bg-muted sm:block" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  if (session?.user) {
    const initial = session.user.name.charAt(0).toUpperCase() || 'U'

    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className="h-9 rounded-full px-3" asChild>
          <Link to="/dashboard">Dashboard</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-full pl-1 pr-3"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="size-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 font-heading text-xs font-semibold text-primary">
                  {initial}
                </span>
              )}
              <span className="max-w-28 truncate text-sm font-medium">
                {session.user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">
                {session.user.name}
              </p>
              <p className="truncate text-xs">{session.user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void authClient.signOut().then(() => navigate({ to: '/' }))
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        className={cn(ctaClass, 'hidden h-9 px-3 sm:inline-flex')}
        asChild
      >
        <Link to="/login">Sign In</Link>
      </Button>
      <Button className={cn(ctaClass, 'h-9 px-4')} asChild>
        <Link to="/register">Get Started</Link>
      </Button>
    </>
  )
}

export default AuthHeaderActions
