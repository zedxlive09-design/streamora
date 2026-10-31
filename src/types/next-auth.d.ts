import type { DefaultSession } from 'next-auth'

// Augment NextAuth types with our `id` + `role` fields on Session.user,
// JWT, and User. This makes `session.user.id` and `session.user.role`
// type-check across server components and API routes.

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: string
    }
  }

  interface User {
    id: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
