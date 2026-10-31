'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface FavoriteRemoveButtonProps {
  channelId: string
  channelName?: string
}

export function FavoriteRemoveButton({
  channelId,
  channelName,
}: FavoriteRemoveButtonProps) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/user/favorites/${encodeURIComponent(channelId)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(body.error || 'Failed to remove')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(`Removed ${channelName ?? 'channel'} from favorites`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-destructive"
      aria-label={`Remove ${channelName ?? channelId} from favorites`}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-4" aria-hidden="true" />
      )}
    </Button>
  )
}
