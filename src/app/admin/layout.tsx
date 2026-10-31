import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import {
  Shield,
  Megaphone,
  Users,
  Settings as SettingsIcon,
  ScrollText,
  type LucideIcon,
} from 'lucide-react'

import { authOptions, isAdmin } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Audit log', icon: ScrollText },
  { href: '/admin/ads', label: 'Ads', icon: Megaphone },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin')
  }
  if (!isAdmin(session.user.role)) {
    // Use notFound() via dynamic import to keep imports clean.
    const { notFound } = await import('next/navigation')
    notFound()
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0" aria-label="Admin navigation">
          <nav className="lg:sticky lg:top-20 flex flex-col gap-1">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Shield className="size-4" aria-hidden="true" />
              Admin
            </div>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
