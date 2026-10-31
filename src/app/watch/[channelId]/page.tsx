import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

import { getChannel } from '@/lib/catalog/fetcher'
import { authOptions } from '@/lib/auth'
import { AdSlotRenderer } from '@/components/ads/AdSlotRenderer'
import { WatchView } from '@/components/watch/WatchView'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Watch — Streamora',
}

interface WatchPageProps {
  params: Promise<{ channelId: string }>
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { channelId } = await params
  const decodedId = decodeURIComponent(channelId)

  const session = await getServerSession(authOptions)

  let result
  try {
    result = await getChannel(decodedId)
  } catch (err) {
    console.error('[watch] getChannel failed', err)
    result = null
  }

  if (!result || !result.channel) {
    notFound()
  }

  const { channel, streams, country } = result

  // If user is anonymous and tries to follow "Customize metadata" link, we
  // redirect them through login. The link itself is shown in WatchView;
  // the dashboard route handles the redirect — but we expose a hint banner
  // for anonymous users explaining the link will prompt sign-in.
  const isAnonymous = !session?.user

  return (
    <div className="flex flex-col">
      <div className="container mx-auto max-w-7xl px-4 pt-6">
        <AdSlotRenderer page="watch" position="watch-pre" />
      </div>

      <WatchView channel={channel} streams={streams} country={country} />

      <div className="container mx-auto max-w-7xl px-4 py-6">
        <AdSlotRenderer page="watch" position="watch-mid" />
      </div>

      {isAnonymous && (
        <div className="container mx-auto max-w-7xl px-4 pb-6">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
            <AlertTriangle
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              Sign in to save favorites, keep a watch history, and add custom
              metadata to channels.
            </span>
            <Button asChild size="sm" variant="outline" className="ml-auto">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(
                  `/watch/${channel.id}`,
                )}`}
              >
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
