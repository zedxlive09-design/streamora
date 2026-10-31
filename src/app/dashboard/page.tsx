import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'
import { getProfile } from '@/lib/services/user-data'
import { listCountries } from '@/lib/catalog/fetcher'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

export const metadata = {
  title: 'Profile — Streamora Dashboard',
}

export default async function DashboardProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard')
  }
  const profile = await getProfile(session.user.id)
  const countries = await listCountries().catch(() => [])

  return (
    <ProfileForm
      initial={{
        displayName: profile.displayName,
        defaultCountry: profile.defaultCountry,
        theme: profile.theme,
      }}
      countries={countries}
    />
  )
}
