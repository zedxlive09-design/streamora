import { AdForm } from '@/components/admin/AdForm'

export const metadata = {
  title: 'New ad — Streamora Admin',
}

export default function NewAdPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          New ad slot
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a promotional slot for one or more pages.
        </p>
      </header>
      <AdForm mode="create" />
    </div>
  )
}
