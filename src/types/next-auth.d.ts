// Augment NextAuth types with our `role` field on Session.user and JWT.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
