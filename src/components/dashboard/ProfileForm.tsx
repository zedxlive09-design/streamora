'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Country } from '@/lib/catalog/types'

const ProfileSchema = z.object({
  displayName: z.string().max(80).nullable(),
  defaultCountry: z.string().nullable(),
  theme: z.enum(['light', 'dark', 'system']),
})

type ProfileValues = z.infer<typeof ProfileSchema>

const ALL = '__all__'

interface ProfileFormProps {
  initial: {
    displayName: string | null
    defaultCountry: string | null
    theme: string
  }
  countries: Country[]
}

export function ProfileForm({ initial, countries }: ProfileFormProps) {
  const { data: session, update } = useSession()
  const { setTheme } = useTheme()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      displayName: initial.displayName ?? '',
      defaultCountry: initial.defaultCountry ?? null,
      theme: (initial.theme as ProfileValues['theme']) ?? 'system',
    },
  })

  const themeValue = watch('theme')
  const countryValue = watch('defaultCountry')

  React.useEffect(() => {
    if (themeValue) setTheme(themeValue)
  }, [themeValue, setTheme])

  async function onSubmit(values: ProfileValues) {
    const payload: Record<string, unknown> = {}
    if (values.displayName !== initial.displayName) {
      payload.displayName = values.displayName === '' ? null : values.displayName
    }
    if (values.defaultCountry !== initial.defaultCountry) {
      payload.defaultCountry = values.defaultCountry
    }
    if (values.theme !== initial.theme) {
      payload.theme = values.theme
    }
    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save.')
      return
    }
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(body.error || 'Failed to save profile')
      return
    }
    toast.success('Profile saved')
    // Refresh session in case displayName changed.
    try {
      await update({ user: { name: values.displayName ?? undefined } })
    } catch {
      /* ignore */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your display name, default country and theme.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span>{' '}
              {session?.user?.email ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Role:</span>{' '}
              <span className="uppercase">{session?.user?.role ?? 'USER'}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              type="text"
              maxLength={80}
              placeholder="Your name"
              {...register('displayName')}
            />
            {errors.displayName && (
              <p className="text-xs text-destructive">
                {errors.displayName.message as string}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultCountry">Default country</Label>
            <Select
              value={countryValue ?? ALL}
              onValueChange={(v) =>
                setValue('defaultCountry', v === ALL ? null : v, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="defaultCountry" className="w-full">
                <SelectValue placeholder="No default" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={ALL}>No default</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={themeValue}
              onValueChange={(v) =>
                setValue('theme', v as ProfileValues['theme'], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="theme" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  )
}
