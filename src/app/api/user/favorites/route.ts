import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listFavorites, addFavorite } from '@/lib/services/user-data'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const items = await listFavorites(session.user.id)
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }
  const channelId =
    body && typeof body === 'object' && 'channelId' in body
      ? String((body as { channelId: unknown }).channelId)
      : ''
  if (!channelId || channelId.length > 100) {
    return NextResponse.json(
      { error: 'channelId required (max 100 chars)', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }
  try {
    await addFavorite(session.user.id, channelId)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[api/user/favorites POST]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
