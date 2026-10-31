'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'
import type { SessionUser } from '@/lib/auth'

export interface TypedSession {
  user?: SessionUser
  expires: string
}

export function useSession() {
  const result = useNextAuthSession()
  // Cast the session.user shape — the project's module augmentation for
  // `next-auth` Session.user doesn't get picked up cleanly by TS 5.9 + the
  // `moduleResolution: "bundler"` setup with next-auth v4. Runtime is fine.
  const data = result.data as TypedSession | null
  return { ...result, data }
}
