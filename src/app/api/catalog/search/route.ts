import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/catalog/fetcher'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') ?? 10) || 10))
  if (!q) return NextResponse.json([])
  try {
    const cat = await getCatalog()
    const results: Array<{ id: string; name: string; country: string; streamCount: number }> = []
    for (const c of cat.channels) {
      if (
        c.name.toLowerCase().includes(q) ||
        c.alt_names?.some((n) => n.toLowerCase().includes(q))
      ) {
        results.push({
          id: c.id,
          name: c.name,
          country: c.country,
          streamCount: cat.streamsByChannel.get(c.id)?.length ?? 0,
        })
        if (results.length >= limit) break
      }
    }
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[api/catalog/search]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
