'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  channelId: string
  className?: string
}

async function fetchFavorites(): Promise<{ items: Array<{ channelId: string }> }> {
  const res = await fetch('/api/user/favorites', { cache: 'no-store' })
  if (res.status === 401) return { items: [] }
  if (!res.ok) return { items: [] }
  return res.json() as Promise<{ items: Array<{ channelId: string }> }>
}

export function FavoriteButton({ channelId, className }: FavoriteButtonProps) {
  const { status } = useSession()
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: status === 'authenticated',
    staleTime: 30_000,
    retry: false,
  })

  const isFavorite = !!data?.items?.some((f) => f.channelId === channelId)

  const mutation = useMutation({
    mutationFn: async () => {
      const method = isFavorite ? 'DELETE' : 'POST'
      const res = await fetch(
        isFavorite
          ? `/api/user/favorites/${encodeURIComponent(channelId)}`
          : '/api/user/favorites',
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: isFavorite ? undefined : JSON.stringify({ channelId }),
        },
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(body.error || 'Failed to update favorite')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(
        isFavorite ? 'Removed from favorites' : 'Added to favorites',
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not update favorite')
    },
  })

  if (status === 'unauthenticated') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        disabled
        title="Sign in to save favorites"
      >
        <Heart className="size-4" aria-hidden="true" />
        Sign in to favorite
      </Button>
    )
  }

  return (
    <Button
      variant={isFavorite ? 'default' : 'outline'}
      size="sm"
      className={cn('gap-2', className)}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending || status === 'loading'}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? 'Remove from favorites' : 'Add to favorites'
      }
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart
          className={cn('size-4', isFavorite && 'fill-current')}
          aria-hidden="true"
        />
      )}
      {isFavorite ? 'Favorited' : 'Favorite'}
    </Button>
  )
}
