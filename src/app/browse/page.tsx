import { AlertCircle } from 'lucide-react'

import { BrowseClient } from '@/components/browse/BrowseClient'
import { AdSlotRenderer } from '@/components/ads/AdSlotRenderer'
import {
  listCountries,
  listCategories,
  listLanguages,
} from '@/lib/catalog/fetcher'

export const metadata = {
  title: 'Browse — Streamora',
}

export default async function BrowsePage() {
  const [countries, categories, languages] = await Promise.all([
    listCountries().catch(() => [] as Awaited<ReturnType<typeof listCountries>>),
    listCategories().catch(() => [] as Awaited<ReturnType<typeof listCategories>>),
    listLanguages().catch(() => [] as Awaited<ReturnType<typeof listLanguages>>),
  ])

  const catalogUnreachable =
    countries.length === 0 && categories.length === 0 && languages.length === 0

  return (
    <div className="flex flex-col">
      <section className="border-b bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Browse channels
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Filter the iptv-org catalog by country, category, language and more.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 pt-6">
        <AdSlotRenderer page="browse" position="browse-top" />
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
              environment. Please try again later.
            </p>
          </div>
        </section>
      ) : (
        <BrowseClient
          countries={countries}
          categories={categories}
          languages={languages}
        />
      )}
    </div>
  )
}
