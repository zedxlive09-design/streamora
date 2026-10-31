import { NextResponse } from 'next/server'
import { listChannels, type ChannelQuery } from '@/lib/catalog/fetcher'

const CATALOG_CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = url.searchParams
  const q: ChannelQuery = {
    page: Number(params.get('page') ?? 1) || 1,
    pageSize: Number(params.get('pageSize') ?? 50) || 50,
    search: params.get('search') ?? undefined,
    country: params.get('country') ?? undefined,
    category: params.get('category') ?? undefined,
    language: params.get('language') ?? undefined,
    includeNsfw: params.get('includeNsfw') === 'true',
  }
  try {
    const result = await listChannels(q)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': CATALOG_CACHE },
    })
  } catch (err) {
    console.error('[api/catalog/channels]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
