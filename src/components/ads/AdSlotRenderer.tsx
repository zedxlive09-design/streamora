'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AdPosition, PageName } from '@/lib/services/admin'

interface ResolvedAdSlot {
  id: string
  name: string
  position: string
  type: string
  content: string
  frequency: string
  intervalMinutes: number | null
  metadata: Record<string, unknown>
}

interface AdsResponse {
  items?: ResolvedAdSlot[]
  error?: string
}

function isSafeLink(url: unknown): url is string {
  if (typeof url !== 'string') return false
  return /^https?:\/\//i.test(url) || url.startsWith('/')
}

function AdBadge() {
  return (
    <span
      className="pointer-events-none absolute right-1.5 top-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"
      aria-label="Advertisement"
    >
      Ad
    </span>
  )
}

function DismissButton(onDismiss: () => void) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onDismiss}
      aria-label="Dismiss advertisement"
      className="absolute right-1.5 top-1.5 z-20 size-5 bg-black/40 text-white hover:bg-black/70 hover:text-white"
    >
      <X className="size-3" aria-hidden="true" />
    </Button>
  )
}

function renderSlot(slot: ResolvedAdSlot, onDismiss?: () => void) {
  const dismissible = slot.metadata.dismissible === true
  const alt =
    typeof slot.metadata.alt === 'string' ? slot.metadata.alt : slot.name
  const linkUrl = slot.metadata.linkUrl

  const wrapperClass =
    'relative overflow-hidden rounded-md border bg-muted/40 p-4 text-sm'

  if (slot.type === 'image') {
    const img = (
      <img
        src={slot.content}
        alt={alt}
        className="block max-h-[120px] w-full object-contain"
        loading="lazy"
      />
    )
    return (
      <div key={slot.id} className={cn(wrapperClass, 'p-1')}>
        <AdBadge />
        {dismissible && onDismiss
          ? DismissButton(onDismiss)
          : null}
        {isSafeLink(linkUrl) ? (
          <a
            href={linkUrl}
            target={linkUrl.startsWith('/') ? undefined : '_blank'}
            rel={linkUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
            className="block"
          >
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    )
  }

  if (slot.type === 'html') {
    // Render in a fully sandboxed iframe with no permissions.
    return (
      <div key={slot.id} className={cn(wrapperClass, 'p-0')}>
        <AdBadge />
        {dismissible && onDismiss ? DismissButton(onDismiss) : null}
        <iframe
          sandbox=""
          srcDoc={slot.content}
          title={slot.name}
          className="block min-h-[90px] w-full border-0"
          loading="lazy"
        />
      </div>
    )
  }

  // Default: text
  return (
    <div key={slot.id} className={wrapperClass}>
      <AdBadge />
      {dismissible && onDismiss ? DismissButton(onDismiss) : null}
      <div className="pr-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {slot.name}
        </p>
        <p className="mt-1 whitespace-pre-line break-words">{slot.content}</p>
        {isSafeLink(linkUrl) && (
          <a
            href={linkUrl}
            target={linkUrl.startsWith('/') ? undefined : '_blank'}
            rel={linkUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
            className="mt-1 inline-block text-xs underline"
          >
            Learn more
          </a>
        )}
      </div>
    </div>
  )
}

interface AdSlotRendererProps {
  page: PageName
  position: AdPosition
  className?: string
}

export function AdSlotRenderer({
  page,
  position,
  className,
}: AdSlotRendererProps) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set())

  const { data, isError } = useQuery<AdsResponse>({
    queryKey: ['ads', page, position],
    queryFn: async () => {
      const res = await fetch(
        `/api/ads?page=${encodeURIComponent(page)}&position=${encodeURIComponent(position)}`,
        { cache: 'no-store' },
      )
      if (!res.ok) return { items: [] }
      return res.json() as Promise<AdsResponse>
    },
    staleTime: 60_000,
    retry: false,
  })

  if (isError) return null
  const items = (data?.items ?? []).filter((s) => !dismissed.has(s.id))
  if (items.length === 0) return null

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      aria-label="Advertisements"
      role="region"
    >
      {items.map((slot) =>
        renderSlot(slot, () => dismiss(slot.id)),
      )}
    </div>
  )
}
