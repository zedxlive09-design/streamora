import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { History, Play } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { listHistory } from '@/lib/services/user-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'History — Streamora Dashboard',
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/history')
  }

  const items = await listHistory(session.user.id)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Watch history
          </h1>
          <p className="text-sm text-muted-foreground">
            Your last 100 watched streams.
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <History className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">No history yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Play any channel and we&apos;ll keep it here for quick re-watching.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/browse">Browse channels</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border" role="list">
          {items.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-3 p-3"
              role="listitem"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/watch/${encodeURIComponent(h.channelId)}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {h.channelName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(h.watchedAt), 'PPp')}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="shrink-0 gap-2"
              >
                <Link href={`/watch/${encodeURIComponent(h.channelId)}`}>
                  <Play className="size-4" aria-hidden="true" />
                  Watch again
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
