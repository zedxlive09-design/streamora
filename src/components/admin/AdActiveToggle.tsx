'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'

interface AdActiveToggleProps {
  slotId: string
  initialActive: boolean
}

export function AdActiveToggle({ slotId, initialActive }: AdActiveToggleProps) {
  const qc = useQueryClient()
  const [active, setActive] = React.useState(initialActive)

  React.useEffect(() => {
    setActive(initialActive)
  }, [initialActive])

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch(`/api/admin/ads/${encodeURIComponent(slotId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Failed to update')
      }
    },
    onMutate: async (next) => {
      setActive(next)
    },
    onError: (err: Error, _next, _ctx) => {
      setActive(initialActive)
      toast.error(err.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ads'] })
      toast.success('Ad updated')
    },
  })

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={active}
        onCheckedChange={(v) => mutation.mutate(v)}
        disabled={mutation.isPending}
        aria-label="Toggle ad active"
      />
      {mutation.isPending ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : null}
    </div>
  )
}
