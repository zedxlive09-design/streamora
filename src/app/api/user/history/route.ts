import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { listHistory, recordHistory } from '@/lib/services/user-data'

const HistoryCreateSchema = z.object({
  channelId: z.string().min(1).max(100),
  channelName: z.string().min(1).max(200),
  streamUrl: z.string().min(1).max(2000),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const items = await listHistory(session.user.id)
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
  const parsed = HistoryCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  try {
    const created = await recordHistory(session.user.id, parsed.data)
    return NextResponse.json({ id: created.id, watchedAt: created.watchedAt }, { status: 201 })
  } catch (err) {
    console.error('[api/user/history POST]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
