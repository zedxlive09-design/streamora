import { getServerSession } from 'next-auth/next'
import { redirect, notFound } from 'next/navigation'

import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdForm } from '@/components/admin/AdForm'

export const metadata = {
  title: 'Edit ad — Streamora Admin',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAdPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/ads')
  if (!isAdmin(session.user.role)) redirect('/')

  const { id } = await params
  const slot = await db.adSlot
    .findUnique({
      where: { id },
      include: { placements: true },
    })
    .catch(() => null)

  if (!slot) notFound()

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Edit ad slot
        </h1>
        <p className="text-sm text-muted-foreground">
          Editing &ldquo;{slot.name}&rdquo;.
        </p>
      </header>
      <AdForm mode="edit" slot={slot} />
    </div>
  )
}
