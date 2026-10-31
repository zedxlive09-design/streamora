'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface AdDeleteButtonProps {
  slotId: string
  slotName: string
}

export function AdDeleteButton({ slotId, slotName }: AdDeleteButtonProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/ads/${encodeURIComponent(slotId)}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Failed to delete')
      }
    },
    onSuccess: () => {
      toast.success(`Deleted "${slotName}"`)
      qc.invalidateQueries({ queryKey: ['admin-ads'] })
      setOpen(false)
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ad ${slotName}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete ad?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes &quot;{slotName}&quot;. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
