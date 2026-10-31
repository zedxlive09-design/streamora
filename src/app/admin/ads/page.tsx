import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { Plus, Pencil } from 'lucide-react'

import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AdActiveToggle } from '@/components/admin/AdActiveToggle'
import { AdDeleteButton } from '@/components/admin/AdDeleteButton'

export const metadata = {
  title: 'Ads — Streamora Admin',
}

export default async function AdminAdsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/ads')
  if (!isAdmin(session.user.role)) redirect('/')

  const items = await db.adSlot
    .findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { placements: true },
    })
    .catch(() => [])

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Ads</h1>
          <p className="text-sm text-muted-foreground">
            Manage promotional slots shown across the site.
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/admin/ads/new">
            <Plus className="size-4" aria-hidden="true" />
            New ad
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Slots</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No ads yet. Click &ldquo;New ad&rdquo; to create one.
            </p>
          ) : (
            <div className="streamora-scroll max-h-[40rem] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-[20ch] truncate font-medium">
                        {s.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {s.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.frequency}
                        {s.frequency === 'every-n-minutes' &&
                          s.intervalMinutes &&
                          ` · ${s.intervalMinutes}m`}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.placements.length === 0
                          ? 'all'
                          : s.placements.map((p) => p.page).join(', ')}
                      </TableCell>
                      <TableCell>
                        <AdActiveToggle slotId={s.id} initialActive={s.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Edit ${s.name}`}
                          >
                            <Link
                              href={`/admin/ads/${encodeURIComponent(s.id)}/edit`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <AdDeleteButton slotId={s.id} slotName={s.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
