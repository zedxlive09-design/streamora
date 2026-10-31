import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeAudit } from '@/lib/services/admin'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Admin only', code: 'FORBIDDEN' }, { status: 403 })
  }
  const items = await db.siteSetting.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ items })
}

const SettingPutSchema = z.object({ value: z.string().min(0).max(2000) })

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Admin only', code: 'FORBIDDEN' }, { status: 403 })
  }
  const { key } = await params
  if (!key || key.length > 100 || !/^[a-zA-Z0-9_.-]+$/.test(key)) {
    return NextResponse.json(
      { error: 'Invalid key (alphanumeric, dot, dash, underscore, max 100)', code: 'VALIDATION_ERROR' },
      { status: 400 },
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
  const parsed = SettingPutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const updated = await db.siteSetting.upsert({
    where: { key },
    update: { value: parsed.data.value },
    create: { key, value: parsed.data.value },
  })
  await writeAudit(session.user.id, 'setting.update', key, { value: parsed.data.value })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Admin only', code: 'FORBIDDEN' }, { status: 403 })
  }
  const { key } = await params
  try {
    await db.siteSetting.delete({ where: { key } })
    await writeAudit(session.user.id, 'setting.delete', key, {})
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }
}
