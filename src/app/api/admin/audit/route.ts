import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

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
  const userId = url.searchParams.get('userId') ?? undefined
  const action = url.searchParams.get('action') ?? undefined
  const where: { userId?: string; action?: string } = {}
  if (userId) where.userId = userId
  if (action) where.action = action

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { email: true, name: true } } },
    }),
    db.auditLog.count({ where }),
  ])
  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      userId: i.userId,
      userEmail: i.user?.email ?? null,
      userName: i.user?.name ?? null,
      action: i.action,
      target: i.target,
      metadata: i.metadata,
      createdAt: i.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}
