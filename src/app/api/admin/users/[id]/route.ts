import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions, isAdmin, isSuperadmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { canChangeRole, writeAudit, ROLE_ADMIN, ROLE_USER } from '@/lib/services/admin'

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
    return NextResponse.json({ error: 'Admin only', code: 'FORBIDDEN' }, { status: 403 })
  }
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? PAGE_SIZE) || PAGE_SIZE))
  const search = url.searchParams.get('search')?.trim().toLowerCase()
  const where = search ? { email: { contains: search } } : {}
  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    }),
    db.user.count({ where }),
  ])
  return NextResponse.json({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
}

const RolePatchSchema = z.object({ role: z.enum([ROLE_USER, ROLE_ADMIN, 'SUPERADMIN']) })

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
    return NextResponse.json({ error: 'Admin only', code: 'FORBIDDEN' }, { status: 403 })
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
  const parsed = RolePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } })
  if (!target) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }
  // Superadmin-level actions require superadmin actor.
  if (parsed.data.role === 'SUPERADMIN' && !isSuperadmin(session.user.role)) {
    return NextResponse.json(
      { error: 'Only superadmin may promote to SUPERADMIN', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }
  const allowed = canChangeRole(session.user.role, session.user.id, target.role, target.id, parsed.data.role)
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.error, code: 'FORBIDDEN' }, { status: 403 })
  }
  const updated = await db.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  })
  await writeAudit(session.user.id, 'user.role.update', id, {
    from: target.role,
    to: parsed.data.role,
    targetEmail: target.email,
  })
  return NextResponse.json(updated)
}
