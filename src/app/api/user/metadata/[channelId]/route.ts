import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getMetadata,
  upsertMetadata,
  deleteMetadata,
  validateMetadataFields,
} from '@/lib/services/user-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const { channelId } = await params
  const fields = await getMetadata(session.user.id, channelId)
  return NextResponse.json({ fields: fields ?? [] })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const { channelId } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }
  const fields =
    body && typeof body === 'object' && 'fields' in body
      ? (body as { fields: unknown }).fields
      : null
  const v = validateMetadataFields(fields)
  if (!v.ok || !v.data) {
    return NextResponse.json(
      { error: v.error ?? 'Invalid fields', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }
  await upsertMetadata(session.user.id, channelId, v.data)
  return NextResponse.json({ fields: v.data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const { channelId } = await params
  await deleteMetadata(session.user.id, channelId)
  return new NextResponse(null, { status: 204 })
}
