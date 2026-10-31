'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Globe, Pencil, Radio, ExternalLink, Tag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { FavoriteButton } from './FavoriteButton'
import type { Channel, Stream, Country } from '@/lib/catalog/types'

interface WatchViewProps {
  channel: Channel
  streams: Stream[]
  country: Country | null
}

function flagEmoji(code?: string): string {
  if (!code || code.length !== 2) return '🌐'
  const A = 0x1f1e6
  const upper = code.toUpperCase()
  return String.fromCodePoint(
    A + (upper.charCodeAt(0) - 65),
    A + (upper.charCodeAt(1) - 65),
  )
}

function safeStreamUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function WatchHistoryReporter({
  channelId,
  channelName,
  streamUrl,
}: {
  channelId: string
  channelName: string
  streamUrl: string
}) {
  const { data: session } = useSession()
  const postedRef = React.useRef<string>('')

  React.useEffect(() => {
    if (!session?.user?.id) return
    const key = `${channelId}|${streamUrl}`
    if (postedRef.current === key) return
    postedRef.current = key
    fetch('/api/user/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, channelName, streamUrl }),
    }).catch(() => {
      /* swallow — best-effort */
    })
  }, [session?.user?.id, channelId, channelName, streamUrl])

  return null
}

export function WatchView({ channel, streams, country }: WatchViewProps) {
  const playableStreams = streams.filter((s) => safeStreamUrl(s.url))
  const [streamIdx, setStreamIdx] = React.useState(0)
  const current = playableStreams[streamIdx] ?? playableStreams[0]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: player */}
        <div className="min-w-0 flex-1">
          <h1 className="mb-2 flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            {channel.name}
          </h1>

          {current ? (
            <>
              <VideoPlayer
                url={current.url}
                title={channel.name}
                labels={current.labels}
              />
              <WatchHistoryReporter
                channelId={channel.id}
                channelName={channel.name}
                streamUrl={current.url}
              />
            </>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border bg-muted text-center text-sm text-muted-foreground">
              <Radio className="size-6" aria-hidden="true" />
              No playable streams available for this channel.
            </div>
          )}

          {playableStreams.length > 1 && (
            <div className="mt-3">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Switch stream ({playableStreams.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {playableStreams.map((s, idx) => (
                  <Button
                    key={`${s.url}-${idx}`}
                    size="sm"
                    variant={idx === streamIdx ? 'default' : 'outline'}
                    onClick={() => setStreamIdx(idx)}
                    aria-pressed={idx === streamIdx}
                  >
                    {s.feed || s.quality || `Stream ${idx + 1}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {current?.labels && current.labels.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Stream labels: {current.labels.join(', ')}
            </p>
          )}
        </div>

        {/* Right: info */}
        <aside className="lg:w-96 lg:shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Country</span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-base leading-none">
                    {flagEmoji(channel.country)}
                  </span>
                  {country ? country.name : channel.country}
                </span>
              </div>

              {channel.network && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Network</span>
                  <span className="truncate">{channel.network}</span>
                </div>
              )}

              {channel.owners?.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Owners</span>
                  <span className="truncate">{channel.owners.join(', ')}</span>
                </div>
              )}

              {channel.website && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Website</span>
                  <a
                    href={channel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 truncate text-primary hover:underline"
                  >
                    <Globe className="size-3.5" aria-hidden="true" />
                    Visit
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Tag className="size-3" aria-hidden="true" />
                  Categories
                </span>
                {channel.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {channel.categories.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px]">
                        {c}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No categories listed.
                  </span>
                )}
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <FavoriteButton channelId={channel.id} />
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link
                    href={`/dashboard/metadata/${encodeURIComponent(channel.id)}`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Customize metadata
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {channel.alt_names?.length > 0 && (
            <Card className="mt-3">
              <CardHeader>
                <CardTitle className="text-base">Also known as</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {channel.alt_names.join(' · ')}
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
