import { NextResponse } from 'next/server'
import { listLanguages } from '@/lib/catalog/fetcher'

export async function GET() {
  try {
    const items = await listLanguages()
    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('[api/catalog/languages]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
