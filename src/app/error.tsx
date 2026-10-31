'use client'

import * as React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <AlertTriangle
        className="size-8 text-muted-foreground"
        aria-hidden="true"
      />
      <h1 className="text-2xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while rendering this page. You can try
        again, or return home.
      </p>
      {error.digest && (
        <p className="font-mono text-[10px] text-muted-foreground">
          digest: {error.digest}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Button onClick={reset} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild size="sm">
          <a href="/">Home</a>
        </Button>
      </div>
    </div>
  )
}
