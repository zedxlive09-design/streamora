import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const PAGE_SIZE = 50

// GET /api/admin/users — paginated list of users (no passwordHash).
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
  const page = Math.max(
    1,
    Number(url.searchParams.get('page') ?? 1) || 1,
  )
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('pageSize') ?? PAGE_SIZE) || PAGE_SIZE),
  )
  const search = url.searchParams.get('search')?.trim().toLowerCase()
  const where = search
    ? {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      // NEVER expose passwordHash.
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}
