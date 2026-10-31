'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SettingRowProps {
  settingKey: string
  initialValue: string
}

export function SettingRow({ settingKey, initialValue }: SettingRowProps) {
  const qc = useQueryClient()
  const [value, setValue] = React.useState(initialValue)
  const [editing, setEditing] = React.useState(false)

  React.useEffect(() => setValue(initialValue), [initialValue])

  const saveMutation = useMutation({
    mutationFn: async (next: string) => {
      const res = await fetch(
        `/api/admin/settings/${encodeURIComponent(settingKey)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: next }),
        },
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Failed to save')
      }
    },
    onSuccess: () => {
      setEditing(false)
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      toast.success(`Saved ${settingKey}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/admin/settings/${encodeURIComponent(settingKey)}`,
        { method: 'DELETE' },
      )
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Failed to delete')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      toast.success(`Deleted ${settingKey}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="flex items-center gap-2 border-b p-3">
      <div className="w-1/3 min-w-[10ch] truncate font-mono text-xs">
        {settingKey}
      </div>
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setEditing(true)
        }}
        className="flex-1"
        aria-label={`Value for ${settingKey}`}
      />
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => saveMutation.mutate(value)}
          disabled={!editing || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-3.5" aria-hidden="true" />
          )}
          <span className="sr-only">Save</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          aria-label={`Delete ${settingKey}`}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3.5" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  )
}

interface NewSettingRowProps {
  onCreated: () => void
}

export function NewSettingRow({ onCreated }: NewSettingRowProps) {
  const [key, setKey] = React.useState('')
  const [value, setValue] = React.useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Failed to create')
      }
    },
    onSuccess: () => {
      setKey('')
      setValue('')
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      toast.success('Setting created')
      onCreated()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <form
      className="flex items-center gap-2 border-t bg-muted/30 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!key.trim()) return
        mutation.mutate()
      }}
    >
      <Input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="new-setting-key"
        className="w-1/3 min-w-[10ch] font-mono text-xs"
        aria-label="New setting key"
        pattern="[a-zA-Z0-9_.\-]+"
        title="Alphanumeric, dot, dash, underscore"
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="value"
        className="flex-1"
        aria-label="New setting value"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!key.trim() || mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : null}
        Add
      </Button>
    </form>
  )
}

interface SettingsListProps {
  items: Array<{ key: string; value: string; updatedAt: string }>
}

export function SettingsEditor({ items }: SettingsListProps) {
  const [nonce, setNonce] = React.useState(0)
  return (
    <div className="overflow-hidden rounded-lg border">
      {items.map((s) => (
        <SettingRow
          key={`${s.key}-${nonce}`}
          settingKey={s.key}
          initialValue={s.value}
        />
      ))}
      <NewSettingRow onCreated={() => setNonce((n) => n + 1)} />
    </div>
  )
}
