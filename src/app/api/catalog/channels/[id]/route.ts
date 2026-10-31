import { NextResponse } from 'next/server'
import { getChannel } from '@/lib/catalog/fetcher'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const result = await getChannel(id)
    if (!result) {
      return NextResponse.json(
        { error: 'Channel not found', code: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('[api/catalog/channels/[id]]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
