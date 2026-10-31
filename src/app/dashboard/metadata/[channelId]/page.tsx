import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { getChannel } from '@/lib/catalog/fetcher'
import { getMetadata } from '@/lib/services/user-data'
import { MetadataEditor } from '@/components/dashboard/MetadataEditor'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Customize metadata — Streamora Dashboard',
}

interface PageProps {
  params: Promise<{ channelId: string }>
}

export default async function MetadataPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard')
  }

  const { channelId } = await params
  const decodedId = decodeURIComponent(channelId)

  const [channelResult, fields] = await Promise.all([
    getChannel(decodedId).catch(() => null),
    getMetadata(session.user.id, decodedId),
  ])

  const channel = channelResult?.channel
  const channelName = channel?.name ?? decodedId

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 gap-2 px-2">
          <Link href={`/watch/${encodeURIComponent(decodedId)}`}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back to {channelName}
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Customize metadata
        </h1>
        <p className="text-sm text-muted-foreground">
          Channel:{' '}
          <span className="font-medium text-foreground">{channelName}</span>
          {channel?.country && (
            <>
              {' '}
              · <span className="uppercase">{channel.country}</span>
            </>
          )}
        </p>
      </div>

      <MetadataEditor
        channelId={decodedId}
        initialFields={fields ?? []}
        channelName={channelName}
      />
    </div>
  )
}
