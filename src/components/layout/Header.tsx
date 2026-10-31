'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import {
  Menu,
  Moon,
  Sun,
  Tv,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Shield,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isAdmin } from '@/lib/auth'
import { useSession } from '@/hooks/use-typed-session'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  show: boolean
}

export function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const role = session?.user?.role
  const showAdmin = isAdmin(role)

  const links: NavLink[] = [
    { href: '/', label: 'Home', show: true },
    { href: '/browse', label: 'Browse', show: true },
    { href: '/dashboard', label: 'Dashboard', show: !!session?.user },
    { href: '/admin', label: 'Admin', show: showAdmin },
  ]

  const initials = session?.user?.email
    ? session.user.email.slice(0, 2).toUpperCase()
    : '??'

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Streamora home"
        >
          <Tv className="size-5 text-primary" aria-hidden="true" />
          <span>Streamora</span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="ml-4 hidden md:flex items-center gap-1"
          aria-label="Primary"
        >
          {links
            .filter((l) => l.show)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive(link.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="size-5" aria-hidden="true" />
            ) : (
              <Moon className="size-5" aria-hidden="true" />
            )}
          </Button>

          {/* Auth area (desktop) */}
          {status === 'loading' ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 px-2"
                  aria-label="Open user menu"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm max-w-[12ch] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium truncate">
                      {session.user.name || 'Account'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </span>
                    <span className="mt-1 inline-flex w-fit items-center rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {showAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="size-4" aria-hidden="true" />
                      Admin panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => signOut({ callbackUrl: '/' })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile nav trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Tv className="size-4" aria-hidden="true" />
                  Streamora
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4" aria-label="Mobile primary">
                {links
                  .filter((l) => l.show)
                  .map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                          isActive(link.href) && 'bg-accent',
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                <div className="my-2 h-px bg-border" />
                {!session?.user && (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/login">
                          <UserIcon className="size-4" aria-hidden="true" />
                          Sign in
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild size="sm">
                        <Link href="/signup">Sign up</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
                {session?.user && (
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Sign out
                    </Button>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
