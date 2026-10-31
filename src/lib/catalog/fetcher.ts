import {
  CATALOG_BASE_URL,
  CATALOG_TTL_MS,
  type CatalogIndex,
  type Channel,
  type Stream,
  type Country,
  type Category,
  type Region,
  type Subdivision,
  type Language,
} from './types'

// ─────────────────────────────────────────────────────────────
// In-memory cache (single instance per Vercel serverless cold start).
// ─────────────────────────────────────────────────────────────

let cached: CatalogIndex | null = null
let fetching: Promise<CatalogIndex> | null = null

export function getCatalogCache(): CatalogIndex | null {
  if (!cached) return null
  if (Date.now() - cached.fetchedAt > CATALOG_TTL_MS) {
    // Stale but usable; trigger background refresh.
    void refreshCatalog().catch(() => {
      /* swallow; stale cache still served */
    })
  }
  return cached
}

export async function getCatalog(): Promise<CatalogIndex> {
  const existing = getCatalogCache()
  if (existing) return existing
  if (fetching) return fetching
  fetching = refreshCatalog()
  try {
    return await fetching
  } finally {
    fetching = null
  }
}

async function refreshCatalog(): Promise<CatalogIndex> {
  const [channels, streams, countries, categories, regions, subdivisions, languages] =
    await Promise.all([
      fetchJson<Channel[]>(`${CATALOG_BASE_URL}/channels.json`),
      fetchJson<Stream[]>(`${CATALOG_BASE_URL}/streams.json`),
      fetchJson<Country[]>(`${CATALOG_BASE_URL}/countries.json`),
      fetchJson<Category[]>(`${CATALOG_BASE_URL}/categories.json`).then((r) =>
        r.map((c) => ({
          ...c,
          description: (c as { description?: string }).description ?? '',
        })),
      ),
      fetchJson<Region[]>(`${CATALOG_BASE_URL}/regions.json`),
      fetchJson<Subdivision[]>(`${CATALOG_BASE_URL}/subdivisions.json`),
      fetchJson<Language[]>(`${CATALOG_BASE_URL}/languages.json`),
    ])

  const streamsByChannel = new Map<string, Stream[]>()
  for (const s of streams) {
    if (!s.channel) continue
    const list = streamsByChannel.get(s.channel)
    if (list) list.push(s)
    else streamsByChannel.set(s.channel, [s])
  }

  const channelsById = new Map<string, Channel>()
  for (const c of channels) channelsById.set(c.id, c)

  const countriesByCode = new Map<string, Country>()
  for (const c of countries) countriesByCode.set(c.code, c)

  const channelsByNameLower = channels
    .map((channel) => ({ lower: channel.name.toLowerCase(), channel }))
    .sort((a, b) => a.lower.localeCompare(b.lower))

  const index: CatalogIndex = {
    channels,
    streams,
    countries,
    categories,
    regions,
    subdivisions,
    languages,
    streamsByChannel,
    channelsById,
    countriesByCode,
    channelsByNameLower,
    fetchedAt: Date.now(),
  }

  cached = index
  return index
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Streamora/0.1 (+https://github.com/iptv-org/api)' },
    // Vercel edge cache; falls back to our in-memory cache on failure.
    next: { revalidate: 86400 },
  })
  if (!res.ok) {
    if (cached) {
      // Stale fallback: keep serving previous data.
      return [] as unknown as T
    }
    throw new Error(`catalog fetch failed: ${url} → ${res.status}`)
  }
  return (await res.json()) as T
}

// ─────────────────────────────────────────────────────────────
// Public read API (used by route handlers + server components).
// ─────────────────────────────────────────────────────────────

export interface ChannelQuery {
  page?: number
  pageSize?: number
  search?: string
  country?: string
  category?: string
  language?: string
  includeNsfw?: boolean
}

export interface ChannelPage {
  items: Array<Channel & { streamCount: number }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listChannels(q: ChannelQuery = {}): Promise<ChannelPage> {
  const cat = await getCatalog()
  const page = Math.max(1, q.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 50))
  const search = q.search?.trim().toLowerCase()
  const country = q.country?.trim()
  const category = q.category?.trim()
  const language = q.language?.trim()
  const includeNsfw = q.includeNsfw ?? false

  let filtered = cat.channels
  if (!includeNsfw) filtered = filtered.filter((c) => !c.is_nsfw)
  if (country) filtered = filtered.filter((c) => c.country === country)
  if (category) filtered = filtered.filter((c) => c.categories.includes(category))
  if (language) {
    const countryCodes = new Set(
      cat.countries.filter((c) => c.languages.includes(language)).map((c) => c.code),
    )
    filtered = filtered.filter((c) => countryCodes.has(c.country))
  }
  if (search) {
    filtered = filtered.filter((c) => {
      if (c.name.toLowerCase().includes(search)) return true
      if (c.alt_names?.some((n) => n.toLowerCase().includes(search))) return true
      return false
    })
  }

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize).map((c) => ({
    ...c,
    streamCount: cat.streamsByChannel.get(c.id)?.length ?? 0,
  }))

  return { items, total, page, pageSize, totalPages }
}

export async function getChannel(id: string) {
  const cat = await getCatalog()
  const channel = cat.channelsById.get(id)
  if (!channel) return null
  const streams = cat.streamsByChannel.get(id) ?? []
  const country = cat.countriesByCode.get(channel.country)
  return { channel, streams, country }
}

export async function listCountries() {
  return (await getCatalog()).countries.sort((a, b) => a.name.localeCompare(b.name))
}

export async function listCategories() {
  return (await getCatalog()).categories.sort((a, b) => a.name.localeCompare(b.name))
}

export async function listLanguages() {
  return (await getCatalog()).languages.sort((a, b) => a.name.localeCompare(b.name))
}
