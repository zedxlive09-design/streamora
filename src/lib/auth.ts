import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const ROLE_USER = 'USER'
export const ROLE_ADMIN = 'ADMIN'
export const ROLE_SUPERADMIN = 'SUPERADMIN'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.trim().toLowerCase()
        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? ROLE_USER
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string }).id = token.id as string
        ;(session.user as { role?: string }).role = (token.role as string) ?? ROLE_USER
      }
      return session
    },
  },
}

// ─────────────────────────────────────────────────────────────
// Authorization helpers
// ─────────────────────────────────────────────────────────────

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  role: string
}

export function isAdmin(role?: string): boolean {
  return role === ROLE_ADMIN || role === ROLE_SUPERADMIN
}

export function isSuperadmin(role?: string): boolean {
  return role === ROLE_SUPERADMIN
}
