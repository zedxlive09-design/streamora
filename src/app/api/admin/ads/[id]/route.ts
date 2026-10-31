import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { validateAdSlotUpdate, writeAudit } from '@/lib/services/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params
  const slot = await db.adSlot.findUnique({
    where: { id },
    include: { placements: true },
  })
  if (!slot) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }
  return NextResponse.json(slot)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }
  const v = validateAdSlotUpdate(body)
  if (!v.ok) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: v.error },
      { status: 400 },
    )
  }
  try {
    const existing = await db.adSlot.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', code: 'NOT_FOUND' },
        { status: 404 },
      )
    }
    const data: Record<string, unknown> = {}
    if (v.data.name !== undefined) data.name = v.data.name
    if (v.data.position !== undefined) data.position = v.data.position
    if (v.data.type !== undefined) data.type = v.data.type
    if (v.data.content !== undefined) data.content = v.data.content
    if (v.data.frequency !== undefined) data.frequency = v.data.frequency
    if (v.data.intervalMinutes !== undefined) data.intervalMinutes = v.data.intervalMinutes ?? null
    if (v.data.isActive !== undefined) data.isActive = v.data.isActive
    if (v.data.metadata !== undefined) data.metadata = JSON.stringify(v.data.metadata)
    const updated = await db.adSlot.update({
      where: { id },
      data,
      include: { placements: true },
    })
    // Replace placements if provided.
    if (v.data.placements !== undefined) {
      await db.adPlacement.deleteMany({ where: { adSlotId: id } })
      if (v.data.placements.length > 0) {
        await db.adPlacement.createMany({
          data: v.data.placements.map((p) => ({ adSlotId: id, page: p.page })),
        })
      }
    }
    await writeAudit(session.user.id, 'ad.update', id, data)
    const refreshed = await db.adSlot.findUnique({ where: { id }, include: { placements: true } })
    return NextResponse.json(refreshed)
  } catch (err) {
    console.error('[api/admin/ads PATCH]', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params
  try {
    await db.adSlot.delete({ where: { id } })
    await writeAudit(session.user.id, 'ad.delete', id, {})
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }
}
