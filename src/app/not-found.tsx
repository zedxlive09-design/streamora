import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Page not found — Streamora',
}

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <p className="text-5xl font-bold tracking-tight text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you were looking for doesn&apos;t exist or may have been moved.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  )
}
