// TypeScript types for the iptv-org dataset.
// Source: https://github.com/iptv-org/api

export interface Channel {
  id: string
  name: string
  alt_names: string[]
  network: string | null
  owners: string[]
  country: string
  categories: string[]
  is_nsfw: boolean
  launched: string | null
  closed: string | null
  replaced_by: string | null
  website: string | null
}

export interface Stream {
  channel: string | null
  feed: string | null
  title: string
  url: string
  referrer: string | null
  user_agent: string | null
  quality: string | null
  labels: string[]
}

export interface Country {
  name: string
  code: string
  languages: string[]
  flag: string
}

export interface Category {
  id: string
  name: string
  description: string | undefined
}

export interface Region {
  code: string
  name: string
  countries: string[]
}

export interface Subdivision {
  country: string
  name: string
  code: string
  parent: string | null
}

export interface Language {
  name: string
  code: string
}

export interface CatalogIndex {
  channels: Channel[]
  streams: Stream[]
  countries: Country[]
  categories: Category[]
  regions: Region[]
  subdivisions: Subdivision[]
  languages: Language[]
  // Derived indexes for fast lookup.
  streamsByChannel: Map<string, Stream[]>
  channelsById: Map<string, Channel>
  countriesByCode: Map<string, Country>
  channelsByNameLower: Array<{ lower: string; channel: Channel }>
  fetchedAt: number
}

export const CATALOG_BASE_URL =
  process.env.CATALOG_BASE_URL ?? 'https://iptv-org.github.io/api'

export const CATALOG_TTL_MS =
  Number(process.env.CATALOG_TTL_MS ?? 24 * 60 * 60 * 1000) // 24h

export const CATALOG_FILES = [
  'channels',
  'streams',
  'countries',
  'categories',
  'regions',
  'subdivisions',
  'languages',
] as const

export type CatalogFile = (typeof CATALOG_FILES)[number]
