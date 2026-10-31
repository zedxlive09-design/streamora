import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ROLE_SUPERADMIN, ROLE_USER } from '@/lib/auth'

const SignupSchema = z.object({
  email: z.string().email().max(254).trim().toLowerCase(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }

  const parsed = SignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const { email, password, name } = parsed.data

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } })
      if (existing) {
        return { kind: 'conflict' as const }
      }
      const userCount = await tx.user.count()
      const role = userCount === 0 ? ROLE_SUPERADMIN : ROLE_USER
      const passwordHash = await bcrypt.hash(password, 12)
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role,
          profile: { create: { displayName: name ?? null } },
        },
      })
      return { kind: 'ok' as const, user }
    })

    if (result.kind === 'conflict') {
      return NextResponse.json(
        { error: 'Email already registered', code: 'CONFLICT' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[signup] internal error', err)
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
