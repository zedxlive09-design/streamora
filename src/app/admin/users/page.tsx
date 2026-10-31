import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
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
import { RoleSelect } from '@/components/admin/RoleSelect'

export const metadata = {
  title: 'Users — Streamora Admin',
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/users')
  if (!isAdmin(session.user.role)) redirect('/')

  const items = await db.user
    .findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })
    .catch(() => [])

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage account roles. Showing latest 50 users.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No users yet.
            </p>
          ) : (
            <div className="streamora-scroll max-h-[40rem] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="truncate text-sm font-medium">
                        {u.email}
                      </TableCell>
                      <TableCell className="truncate text-sm">
                        {u.name || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(u.createdAt), 'PP')}
                      </TableCell>
                      <TableCell>
                        <RoleSelect
                          userId={u.id}
                          currentRole={u.role}
                          actorRole={session.user.role}
                          actorId={session.user.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <Badge variant="outline" className="mr-1 text-[10px]">Note</Badge>
        You cannot demote yourself. Only superadmins can promote to or demote
        from SUPERADMIN.
      </p>
    </div>
  )
}
