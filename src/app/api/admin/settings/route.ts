import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/settings — list all site settings as { items: [...] }.
export async function GET() {
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

  const rows = await db.siteSetting.findMany({
    orderBy: { key: 'asc' },
  })
  return NextResponse.json({
    items: rows.map((r) => ({
      key: r.key,
      value: r.value,
      updatedAt: r.updatedAt,
    })),
  })
}
