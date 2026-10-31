import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { SettingsEditor } from '@/components/admin/SettingsEditor'

export const metadata = {
  title: 'Settings — Streamora Admin',
}

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/settings')
  if (!isAdmin(session.user.role)) redirect('/')

  const items = await db.siteSetting.findMany().catch(() => [])

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Site settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Key/value pairs used across the site (brandName, footerAttribution…).
        </p>
      </header>

      <SettingsEditor
        items={items.map((s) => ({
          key: s.key,
          value: s.value,
          updatedAt: s.updatedAt.toISOString(),
        }))}
      />
    </div>
  )
}
