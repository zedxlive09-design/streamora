import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign in — Streamora',
}

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
