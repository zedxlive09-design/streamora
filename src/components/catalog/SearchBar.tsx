'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  name: string
  country: string
  streamCount: number
}

async function searchCatalog(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return []
  const url = `/api/catalog/search?q=${encodeURIComponent(q)}&limit=10`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as SearchResult[] | { error: string }
  if (Array.isArray(data)) return data
  return []
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

export function SearchBar({
  className,
  placeholder = 'Search channels…',
}: {
  className?: string
  placeholder?: string
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const { data, isFetching } = useQuery<SearchResult[]>({
    queryKey: ['catalog-search', query],
    queryFn: () => searchCatalog(query),
    enabled: query.trim().length > 0,
    staleTime: 60_000,
  })

  function go(id: string) {
    setOpen(false)
    setQuery('')
    router.push(`/watch/${id}`)
  }

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-left shadow-xs hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring"
            aria-label="Search channels"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <Search
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span
              className={cn(
                'flex-1 truncate',
                query ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {query || placeholder}
            </span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(560px,90vw)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false} loop>
            <CommandInput
              placeholder="Type a channel name…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {isFetching ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Searching…
                </div>
              ) : null}
              {!isFetching && (data?.length ?? 0) === 0 && query.trim() ? (
                <CommandEmpty>No channels found.</CommandEmpty>
              ) : null}
              {!isFetching && !query.trim() ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Start typing to search the iptv-org catalog.
                </div>
              ) : null}
              {data && data.length > 0 ? (
                <CommandGroup heading="Channels">
                  {data.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={`${r.id} ${r.name}`}
                      onSelect={() => go(r.id)}
                      className="gap-2"
                    >
                      <span aria-hidden="true">{flagEmoji(r.country)}</span>
                      <span className="flex-1 truncate">{r.name}</span>
                      <span className="text-xs uppercase text-muted-foreground">
                        {r.country}
                      </span>
                      {r.streamCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {r.streamCount} streams
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
            <div className="border-t px-2 py-1.5 text-[10px] text-muted-foreground">
              Press <kbd className="font-mono">Enter</kbd> to open ·{' '}
              <Link href="/browse" className="underline">
                Browse all
              </Link>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
