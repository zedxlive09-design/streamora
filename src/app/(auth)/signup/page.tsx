import { Suspense } from 'react'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = {
  title: 'Sign up — Streamora',
}

export default function SignupPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-10">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
