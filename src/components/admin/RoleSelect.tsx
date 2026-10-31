'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_USER, ROLE_ADMIN, ROLE_SUPERADMIN } from '@/lib/auth'

interface RoleSelectProps {
  userId: string
  currentRole: string
  actorRole: string
  actorId: string
}

export function RoleSelect({
  userId,
  currentRole,
  actorRole,
  actorId,
}: RoleSelectProps) {
  const qc = useQueryClient()
  const [value, setValue] = React.useState(currentRole)

  React.useEffect(() => setValue(currentRole), [currentRole])

  const isSelf = actorId === userId
  const isActorSuperadmin = actorRole === ROLE_SUPERADMIN
  const isTargetSuperadmin = currentRole === ROLE_SUPERADMIN

  const mutation = useMutation({
    mutationFn: async (next: string) => {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: next }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Failed to change role')
      }
      return next
    },
    onSuccess: (next) => {
      setValue(next)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(`Role changed to ${next}`)
    },
    onError: (err: Error) => {
      setValue(currentRole)
      toast.error(err.message)
    },
  })

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onValueChange={(v) => mutation.mutate(v)}
        disabled={mutation.isPending || isSelf}
      >
        <SelectTrigger className="h-8 w-32 text-xs" aria-label="User role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ROLE_USER}>USER</SelectItem>
          <SelectItem value={ROLE_ADMIN}>ADMIN</SelectItem>
          {isActorSuperadmin && !isTargetSuperadmin ? (
            <SelectItem value={ROLE_SUPERADMIN}>SUPERADMIN</SelectItem>
          ) : isTargetSuperadmin ? (
            <SelectItem value={ROLE_SUPERADMIN} disabled>
              SUPERADMIN
            </SelectItem>
          ) : (
            <SelectItem value={ROLE_SUPERADMIN} disabled>
              SUPERADMIN (locked)
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {mutation.isPending ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : null}
      {isSelf && (
        <span className="text-[10px] text-muted-foreground">you</span>
      )}
    </div>
  )
}
