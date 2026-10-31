import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { listChannels, getChannel, listCountries, __setCatalogForTesting } from '@/lib/catalog/fetcher'
import type { CatalogIndex, Channel, Stream, Country, Category, Region, Subdivision, Language } from '@/lib/catalog/types'

// Stub catalog data — three channels, two with streams.
function makeStubIndex(): CatalogIndex {
  const channels: Channel[] = [
    {
      id: 'TestTV.us',
      name: 'Test TV',
      alt_names: ['TestTV'],
      network: null,
      owners: [],
      country: 'US',
      categories: ['news'],
      is_nsfw: false,
      launched: null,
      closed: null,
      replaced_by: null,
      website: null,
    },
    {
      id: 'NewsUK.uk',
      name: 'News UK',
      alt_names: [],
      network: null,
      owners: [],
      country: 'GB',
      categories: ['news'],
      is_nsfw: false,
      launched: null,
      closed: null,
      replaced_by: null,
      website: null,
    },
    {
      id: 'AdultTV.xx',
      name: 'Adult TV',
      alt_names: [],
      network: null,
      owners: [],
      country: 'XX',
      categories: ['xxx'],
      is_nsfw: true,
      launched: null,
      closed: null,
      replaced_by: null,
      website: null,
    },
  ]
  const streams: Stream[] = [
    { channel: 'TestTV.us', feed: null, title: 'HD', url: 'https://example.com/test.m3u8', referrer: null, user_agent: null, quality: '720p', labels: [] },
    { channel: 'TestTV.us', feed: null, title: 'SD', url: 'https://example.com/test-sd.m3u8', referrer: null, user_agent: null, quality: '480p', labels: ['geo-blocked'] },
    { channel: 'NewsUK.uk', feed: null, title: 'Main', url: 'https://example.com/news.mp4', referrer: null, user_agent: null, quality: null, labels: [] },
  ]
  const countries: Country[] = [
    { name: 'United States', code: 'US', languages: ['eng'], flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', languages: ['eng'], flag: '🇬🇧' },
    { name: 'Unknown', code: 'XX', languages: [], flag: '🏳️' },
  ]
  const categories: Category[] = [
    { id: 'news', name: 'News', description: 'News channels' },
    { id: 'xxx', name: 'Adults', description: 'Adult content' },
  ]
  const regions: Region[] = []
  const subdivisions: Subdivision[] = []
  const languages: Language[] = [{ name: 'English', code: 'eng' }]

  const streamsByChannel = new Map<string, Stream[]>()
  for (const s of streams) {
    if (!s.channel) continue
    const list = streamsByChannel.get(s.channel)
    if (list) list.push(s)
    else streamsByChannel.set(s.channel, [s])
  }
  const channelsById = new Map(channels.map((c) => [c.id, c]))
  const countriesByCode = new Map(countries.map((c) => [c.code, c]))
  const channelsByNameLower = channels
    .map((channel) => ({ lower: channel.name.toLowerCase(), channel }))
    .sort((a, b) => a.lower.localeCompare(b.lower))

  return {
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
}

describe('catalog fetcher — listChannels', () => {
  beforeEach(() => {
    // Inject stub catalog via test hook (ESM doesn't allow spyOn on internal bindings).
    __setCatalogForTesting(makeStubIndex())
  })
  afterEach(() => __setCatalogForTesting(null))

  it('hides NSFW channels by default', async () => {
    const page = await listChannels({})
    const ids = page.items.map((c) => c.id)
    expect(ids).not.toContain('AdultTV.xx')
    expect(page.total).toBe(2)
  })

  it('includes NSFW channels when includeNsfw=true', async () => {
    const page = await listChannels({ includeNsfw: true })
    expect(page.total).toBe(3)
    expect(page.items.map((c) => c.id)).toContain('AdultTV.xx')
  })

  it('filters by country', async () => {
    const page = await listChannels({ country: 'GB' })
    expect(page.items).toHaveLength(1)
    expect(page.items[0].id).toBe('NewsUK.uk')
  })

  it('filters by category', async () => {
    const page = await listChannels({ category: 'news' })
    expect(page.total).toBe(2)
  })

  it('filters by language via country languages', async () => {
    const page = await listChannels({ language: 'eng' })
    expect(page.total).toBe(2) // TestTV.us + NewsUK.uk
  })

  it('paginates correctly', async () => {
    const page1 = await listChannels({ page: 1, pageSize: 1 })
    expect(page1.items).toHaveLength(1)
    expect(page1.totalPages).toBe(2)
    const page2 = await listChannels({ page: 2, pageSize: 1 })
    expect(page2.items).toHaveLength(1)
    expect(page1.items[0].id).not.toBe(page2.items[0].id)
  })

  it('search matches name (case-insensitive)', async () => {
    const page = await listChannels({ search: 'test' })
    expect(page.items.map((c) => c.id)).toEqual(['TestTV.us'])
  })

  it('search matches alt_names', async () => {
    const page = await listChannels({ search: 'testtv' })
    expect(page.items.map((c) => c.id)).toEqual(['TestTV.us'])
  })

  it('caps pageSize at 100', async () => {
    const page = await listChannels({ pageSize: 500 })
    expect(page.pageSize).toBe(100)
  })

  it('attaches streamCount per channel', async () => {
    const page = await listChannels({ country: 'US' })
    expect(page.items[0].streamCount).toBe(2)
  })
})

describe('catalog fetcher — getChannel', () => {
  beforeEach(() => {
    __setCatalogForTesting(makeStubIndex())
  })
  afterEach(() => __setCatalogForTesting(null))

  it('returns channel + streams + country', async () => {
    const result = await getChannel('TestTV.us')
    expect(result?.channel.id).toBe('TestTV.us')
    expect(result?.streams).toHaveLength(2)
    expect(result?.country?.name).toBe('United States')
  })

  it('returns null for unknown id', async () => {
    const result = await getChannel('DoesNotExist.xx')
    expect(result).toBeNull()
  })
})

describe('catalog fetcher — listCountries', () => {
  beforeEach(() => {
    __setCatalogForTesting(makeStubIndex())
  })
  afterEach(() => __setCatalogForTesting(null))

  it('returns countries sorted by name', async () => {
    const items = await listCountries()
    expect(items.map((c) => c.code)).toEqual(['GB', 'US', 'XX']) // alphabetical by name
  })
})
