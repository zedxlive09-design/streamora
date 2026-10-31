import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { listFavorites } from '@/lib/services/user-data'
import { getCatalog } from '@/lib/catalog/fetcher'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FavoriteRemoveButton } from '@/components/dashboard/FavoriteRemoveButton'

export const metadata = {
  title: 'Favorites — Streamora Dashboard',
}

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/favorites')
  }

  const favorites = await listFavorites(session.user.id)
  let countryName = new Map<string, string>()
  try {
    const cat = await getCatalog()
    countryName = new Map(cat.countries.map((c) => [c.code, c.name]))
  } catch {
    /* ignore */
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Favorites
          </h1>
          <p className="text-sm text-muted-foreground">
            Channels you saved for quick access.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/browse">Browse more</Link>
        </Button>
      </header>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Heart
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">No favorites yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Browse the catalog and tap the heart on a channel to save it here.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/browse">Browse channels</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border" role="list">
          {favorites.map((f) => (
            <li
              key={f.channelId}
              className="flex items-center gap-3 p-3"
              role="listitem"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/watch/${encodeURIComponent(f.channelId)}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {f.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {f.country
                    ? `${countryName.get(f.country) ?? f.country} · ${f.country}`
                    : 'Unknown country'}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {f.country ?? '—'}
              </Badge>
              <FavoriteRemoveButton
                channelId={f.channelId}
                channelName={f.name}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
