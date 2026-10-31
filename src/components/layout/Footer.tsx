'use client'

import * as React from 'react'
import Link from 'next/link'
import { Tv, ExternalLink } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface SettingsResponse {
  items?: Array<{ key: string; value: string; updatedAt: string }>
  error?: string
}

async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetch('/api/admin/settings', { cache: 'no-store' })
  if (!res.ok) {
    // 401/403 are expected for anonymous viewers — fail quietly.
    return { items: [] }
  }
  return res.json() as Promise<SettingsResponse>
}

function findSetting(
  items: Array<{ key: string; value: string }> | undefined,
  key: string,
): string | undefined {
  return items?.find((s) => s.key === key)?.value
}

export function Footer() {
  const { data } = useQuery<SettingsResponse>({
    queryKey: ['site-settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const brandName = findSetting(data?.items, 'brandName') ?? 'Streamora'
  const footerAttribution =
    findSetting(data?.items, 'footerAttribution') ??
    'Channel data from the iptv-org public catalog.'
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Tv className="size-4 text-primary" aria-hidden="true" />
          <span className="font-semibold">{brandName}</span>
          <span className="text-muted-foreground">· © {year}</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <a
            href="https://iptv-org.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            iptv-org
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          <span className="sm:text-right">{footerAttribution}</span>
        </nav>
      </div>
    </footer>
  )
}
