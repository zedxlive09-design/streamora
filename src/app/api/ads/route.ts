import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdsForPage } from '@/lib/services/ads'
import { PAGES, AD_POSITIONS } from '@/lib/services/admin'

const QuerySchema = z.object({
  page: z.enum(PAGES),
  position: z.enum(AD_POSITIONS),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get('page') ?? '',
    position: url.searchParams.get('position') ?? '',
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid page or position', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }
  try {
    const slots = await getAdsForPage(parsed.data.page, parsed.data.position)
    return NextResponse.json(
      { items: slots },
      {
        headers: {
          // Short cache so admin edits propagate within a minute.
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (err) {
    console.error('[api/ads]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
