'use client'

import * as React from 'react'
import Link from 'next/link'
import { Play, Radio } from 'lucide-react'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Channel } from '@/lib/catalog/types'

export interface ChannelCardChannel extends Channel {
  streamCount: number
}

interface ChannelCardProps {
  channel: ChannelCardChannel
  /**
   * Optional map from ISO country code → country name (for screen readers).
   * If omitted, only the code is announced.
   */
  countryName?: string
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

export function ChannelCard({ channel, countryName }: ChannelCardProps) {
  const flag = flagEmoji(channel.country)
  const firstCategories = channel.categories.slice(0, 3)
  const remaining = channel.categories.length - firstCategories.length

  return (
    <Card
      role="article"
      aria-label={`${channel.name} — ${countryName ?? channel.country}`}
      className="group flex flex-col overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 focus-within:shadow-md"
    >
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium leading-tight">
              {channel.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <span aria-hidden="true" className="text-base leading-none">
                {flag}
              </span>
              <span>
                {countryName ? `${countryName} · ` : ''}
                <span className="uppercase">{channel.country || '??'}</span>
              </span>
            </p>
          </div>
          {channel.streamCount > 0 ? (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Radio className="size-3" aria-hidden="true" />
              {channel.streamCount}
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">
              No streams
            </Badge>
          )}
        </div>

        {firstCategories.length > 0 && (
          <div
            className="flex flex-wrap gap-1"
            aria-label={`Categories: ${channel.categories.join(', ')}`}
          >
            {firstCategories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-[10px]">
                {cat}
              </Badge>
            ))}
            {remaining > 0 && (
              <Badge variant="outline" className="text-[10px]">
                +{remaining}
              </Badge>
            )}
          </div>
        )}

        {channel.network && (
          <p className="text-xs text-muted-foreground">
            Network: {channel.network}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/40 p-3">
        <Button
          asChild
          size="sm"
          className="w-full"
          disabled={channel.streamCount === 0}
          aria-label={`Watch ${channel.name}`}
        >
          <Link href={`/watch/${channel.id}`} prefetch={false}>
            <Play className="size-4" aria-hidden="true" />
            Watch
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
