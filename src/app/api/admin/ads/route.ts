import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { validateAdSlotCreate, writeAudit } from '@/lib/services/admin'

const PAGE_SIZE = 50

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: 'Admin only', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? PAGE_SIZE) || PAGE_SIZE))
  const isActiveParam = url.searchParams.get('isActive')
  const where = isActiveParam === 'true' || isActiveParam === 'false' ? { isActive: isActiveParam === 'true' } : {}

  const [items, total] = await Promise.all([
    db.adSlot.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { placements: true },
    }),
    db.adSlot.count({ where }),
  ])
  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json(
      { error: 'Admin only', code: 'FORBIDDEN' },
      { status: 403 },
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
  const v = validateAdSlotCreate(body)
  if (!v.ok) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: v.error },
      { status: 400 },
    )
  }
  try {
    const created = await db.adSlot.create({
      data: {
        name: v.data.name,
        position: v.data.position,
        type: v.data.type,
        content: v.data.content,
        frequency: v.data.frequency,
        intervalMinutes: v.data.intervalMinutes ?? null,
        isActive: v.data.isActive,
        metadata: JSON.stringify(v.data.metadata ?? {}),
        placements: {
          create: (v.data.placements ?? [{ page: 'all' }]).map((p) => ({ page: p.page })),
        },
      },
      include: { placements: true },
    })
    await writeAudit(session.user.id, 'ad.create', created.id, {
      name: created.name,
      position: created.position,
      type: created.type,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[api/admin/ads POST]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
