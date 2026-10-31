import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
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
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Audit log — Streamora Admin',
}

export default async function AdminAuditPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin')
  if (!isAdmin(session.user.role)) redirect('/')

  const items = await db.auditLog
    .findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    })
    .catch(() => [])

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Audit log
        </h1>
        <p className="text-sm text-muted-foreground">
          Latest 50 admin actions.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No audit events yet.
            </p>
          ) : (
            <div className="streamora-scroll max-h-[32rem] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(i.createdAt), 'PPpp')}
                      </TableCell>
                      <TableCell className="truncate text-sm">
                        {i.user?.email ?? i.userId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {i.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="truncate font-mono text-xs">
                        {i.target}
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
