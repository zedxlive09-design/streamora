'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChannelGrid } from '@/components/catalog/ChannelGrid'
import { FilterBar, type ChannelFilters } from '@/components/catalog/FilterBar'
import type { Channel, Country, Category, Language } from '@/lib/catalog/types'

interface ChannelItem extends Channel {
  streamCount: number
}
interface ChannelPage {
  items: ChannelItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface BrowseClientProps {
  countries: Country[]
  categories: Category[]
  languages: Language[]
}

const EMPTY_FILTERS: ChannelFilters = {
  search: '',
  country: '',
  category: '',
  language: '',
  includeNsfw: false,
}

function buildQuery(filters: ChannelFilters, page: number) {
  const p = new URLSearchParams({
    page: String(page),
    pageSize: '30',
  })
  if (filters.search) p.set('search', filters.search)
  if (filters.country) p.set('country', filters.country)
  if (filters.category) p.set('category', filters.category)
  if (filters.language) p.set('language', filters.language)
  if (filters.includeNsfw) p.set('includeNsfw', 'true')
  return p.toString()
}

async function fetchPage(
  filters: ChannelFilters,
  page: number,
): Promise<ChannelPage> {
  const res = await fetch(`/api/catalog/channels?${buildQuery(filters, page)}`)
  if (!res.ok) {
    throw new Error(`Failed to load channels (${res.status})`)
  }
  return res.json() as Promise<ChannelPage>
}

export function BrowseClient({
  countries,
  categories,
  languages,
}: BrowseClientProps) {
  const [filters, setFilters] = React.useState<ChannelFilters>(EMPTY_FILTERS)
  const [page, setPage] = React.useState(1)
  const filtersKey = JSON.stringify(filters)

  React.useEffect(() => {
    setPage(1)
  }, [filtersKey])

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
    ChannelPage,
    Error
  >({
    queryKey: ['browse-channels', filters, page],
    queryFn: () => fetchPage(filters, page),
    placeholderData: (prev) => prev,
  })

  const channels = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const canLoadMore = page < totalPages

  function loadMore() {
    if (canLoadMore) setPage((p) => p + 1)
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 lg:shrink-0" aria-label="Filters">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            countries={countries}
            categories={categories}
            languages={languages}
            className="lg:sticky lg:top-20"
          />
        </aside>

        <div className="min-w-0 flex-1">
          {isError ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertTitle>Couldn&apos;t load channels</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                <span>
                  {error?.message ??
                    'The iptv-org catalog could not be reached. Try again.'}
                </span>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <ChannelGrid
              channels={channels}
              countries={countries}
              loading={isLoading && channels.length === 0}
            />
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            {canLoadMore ? (
              <Button
                onClick={loadMore}
                disabled={isFetching}
                variant="outline"
                size="sm"
              >
                {isFetching ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Load more
              </Button>
            ) : (
              !isError &&
              channels.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {channels.length} of {total} channels
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
