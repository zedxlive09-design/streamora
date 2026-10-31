import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getProfile, updateProfile } from '@/lib/services/user-data'

const ProfilePatchSchema = z.object({
  displayName: z.string().min(1).max(80).nullable().optional(),
  defaultCountry: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable()
    .optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }
  const profile = await getProfile(session.user.id)
  return NextResponse.json(profile)
}

export async function PATCH(request: Request) {
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
  const parsed = ProfilePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  try {
    const updated = await updateProfile(session.user.id, parsed.data)
    return NextResponse.json({
      displayName: updated.displayName,
      defaultCountry: updated.defaultCountry,
      theme: updated.theme,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg, code: 'VALIDATION_ERROR' }, { status: 400 })
  }
}
