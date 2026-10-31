'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ChannelCard, type ChannelCardChannel } from './ChannelCard'
import type { Channel, Country } from '@/lib/catalog/types'

interface ChannelGridProps {
  channels: Array<ChannelCardChannel>
  countries?: Country[]
  loading?: boolean
  emptyLabel?: string
}

function findCountryName(countries: Country[] | undefined, code?: string) {
  if (!code || !countries) return undefined
  return countries.find((c) => c.code === code)?.name
}

export function ChannelGrid({
  channels,
  countries,
  loading,
  emptyLabel = 'No channels found',
}: ChannelGridProps) {
  if (loading && channels.length === 0) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-12 text-center"
      >
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      role="list"
      aria-label="Channels"
    >
      {channels.map((ch) => (
        <div key={ch.id} role="listitem">
          <ChannelCard
            channel={ch}
            countryName={findCountryName(countries, ch.country)}
          />
        </div>
      ))}
    </div>
  )
}

export type { Channel }
