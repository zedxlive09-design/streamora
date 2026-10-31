import { Tv, AlertCircle } from 'lucide-react'

import { HomeClient } from '@/components/home/HomeClient'
import { AdSlotRenderer } from '@/components/ads/AdSlotRenderer'
import { SearchBar } from '@/components/catalog/SearchBar'
import {
  listChannels,
  listCountries,
  listCategories,
  listLanguages,
} from '@/lib/catalog/fetcher'
import { db } from '@/lib/db'

async function getBrandName(): Promise<string> {
  try {
    const row = await db.siteSetting.findUnique({
      where: { key: 'brandName' },
    })
    return row?.value || 'Streamora'
  } catch {
    return 'Streamora'
  }
}

export default async function HomePage() {
  const brandName = await getBrandName()

  // Fetch initial catalog data in parallel. If iptv-org is unreachable,
  // we still want to render the page chrome with a graceful error state.
  const [channelsResult, countries, categories, languages] = await Promise.all([
    listChannels({ page: 1, pageSize: 30 }).catch((err) => {
      console.error('[home] listChannels failed', err)
      return null
    }),
    listCountries().catch((err) => {
      console.error('[home] listCountries failed', err)
      return [] as Awaited<ReturnType<typeof listCountries>>
    }),
    listCategories().catch((err) => {
      console.error('[home] listCategories failed', err)
      return [] as Awaited<ReturnType<typeof listCategories>>
    }),
    listLanguages().catch((err) => {
      console.error('[home] listLanguages failed', err)
      return [] as Awaited<ReturnType<typeof listLanguages>>
    }),
  ])

  const catalogUnreachable = channelsResult === null
  const initialChannels = channelsResult?.items ?? []
  const initialTotal = channelsResult?.total ?? 0

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="streamora-grid relative border-b bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Tv className="size-7" aria-hidden="true" />
              <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                {brandName}
              </span>
            </div>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Free, customizable TV from the iptv-org catalog.
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Browse thousands of free public live-TV streams, save favorites,
              keep a watch history, and add your own per-channel notes — all in
              a clean, themeable interface.
            </p>
            <div className="w-full max-w-xl">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      {/* Ads (top) */}
      <div className="container mx-auto max-w-7xl px-4 pt-6">
        <AdSlotRenderer page="home" position="home-top" />
      </div>

      {catalogUnreachable ? (
        <section className="container mx-auto max-w-7xl px-4 py-10">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <AlertCircle
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium">Catalog unavailable</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              The iptv-org public catalog could not be reached from this
              environment. The rest of the app is fully functional — try
              signing in or browsing once the catalog endpoint is available.
            </p>
          </div>
        </section>
      ) : (
        <HomeClient
          initialChannels={initialChannels}
          initialTotal={initialTotal}
          countries={countries}
          categories={categories}
          languages={languages}
          brandName={brandName}
        />
      )}

      <div className="container mx-auto max-w-7xl px-4 pb-8">
        <AdSlotRenderer page="home" position="home-sidebar" />
      </div>
    </div>
  )
}
