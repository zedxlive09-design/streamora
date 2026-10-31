'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AD_POSITIONS,
  AD_TYPES,
  AD_FREQUENCIES,
  PAGES,
} from '@/lib/services/admin'

const FormSchema = z.object({
  name: z.string().min(1, 'Name required').max(120),
  position: z.enum(AD_POSITIONS),
  type: z.enum(AD_TYPES),
  content: z.string().min(1, 'Content required').max(50_000),
  frequency: z.enum(AD_FREQUENCIES),
  intervalMinutes: z.number().int().positive().nullable(),
  isActive: z.boolean(),
  alt: z.string().max(200),
  linkUrl: z.string().max(2000),
  dismissible: z.boolean(),
  placements: z.array(z.enum(PAGES)),
})

type FormValues = z.infer<typeof FormSchema>

interface AdSlotData {
  id: string
  name: string
  position: string
  type: string
  content: string
  frequency: string
  intervalMinutes: number | null
  isActive: boolean
  metadata: string
  placements?: Array<{ id: string; page: string }>
}

interface AdFormProps {
  mode: 'create' | 'edit'
  slot?: AdSlotData | null
}

function parseInitial(slot?: AdSlotData | null): FormValues {
  if (!slot) {
    return {
      name: '',
      position: 'home-top',
      type: 'text',
      content: '',
      frequency: 'every-load',
      intervalMinutes: null,
      isActive: true,
      alt: '',
      linkUrl: '',
      dismissible: false,
      placements: ['all'],
    }
  }
  let meta: Record<string, unknown> = {}
  try {
    meta = JSON.parse(slot.metadata) as Record<string, unknown>
  } catch {
    /* ignore */
  }
  return {
    name: slot.name,
    position: slot.position as FormValues['position'],
    type: slot.type as FormValues['type'],
    content: slot.content,
    frequency: slot.frequency as FormValues['frequency'],
    intervalMinutes: slot.intervalMinutes,
    isActive: slot.isActive,
    alt: (typeof meta.alt === 'string' ? meta.alt : '') || '',
    linkUrl: (typeof meta.linkUrl === 'string' ? meta.linkUrl : '') || '',
    dismissible: meta.dismissible === true,
    placements:
      slot.placements && slot.placements.length > 0
        ? slot.placements.map((p) => p.page as FormValues['placements'][number])
        : ['all'],
  }
}

export function AdForm({ mode, slot }: AdFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const initial = React.useMemo(() => parseInitial(slot), [slot])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initial,
  })

  const position = watch('position')
  const type = watch('type')
  const frequency = watch('frequency')
  const isActive = watch('isActive')
  const dismissible = watch('dismissible')
  const placements = watch('placements')

  function togglePlacement(page: (typeof PAGES)[number]) {
    const set = new Set(placements)
    if (set.has(page)) set.delete(page)
    else set.add(page)
    setValue('placements', Array.from(set) as FormValues['placements'], {
      shouldDirty: true,
    })
  }

  async function onSubmit(values: FormValues) {
    const body = {
      name: values.name,
      position: values.position,
      type: values.type,
      content: values.content,
      frequency: values.frequency,
      intervalMinutes:
        values.frequency === 'every-n-minutes' ? values.intervalMinutes ?? 1 : null,
      isActive: values.isActive,
      metadata: {
        alt: values.alt || undefined,
        linkUrl: values.linkUrl || undefined,
        dismissible: values.dismissible ? true : undefined,
      },
      placements:
        values.placements.length > 0
          ? values.placements.map((p) => ({ page: p }))
          : [{ page: 'all' }],
    }

    const url =
      mode === 'create'
        ? '/api/admin/ads'
        : `/api/admin/ads/${encodeURIComponent(slot?.id ?? '')}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        details?: { formErrors?: string[] }
      }
      const msg =
        data.details?.formErrors?.[0] ?? data.error ?? 'Failed to save ad'
      toast.error(msg)
      return
    }
    toast.success(mode === 'create' ? 'Ad created' : 'Ad updated')
    router.push('/admin/ads')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {mode === 'create' ? 'New ad slot' : 'Edit ad slot'}
        </CardTitle>
        <CardDescription>
          {pathname} — ads are rendered at a fixed position on one or more pages.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Spring promo banner"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={position}
                onValueChange={(v) =>
                  setValue('position', v as FormValues['position'], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="position" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AD_POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setValue('type', v as FormValues['type'], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Content</Label>
            {type === 'html' ? (
              <Textarea
                id="content"
                rows={6}
                placeholder="<div>…</div>"
                className="font-mono text-xs"
                {...register('content')}
                aria-invalid={!!errors.content}
              />
            ) : (
              <Textarea
                id="content"
                rows={4}
                placeholder={
                  type === 'image'
                    ? 'https://example.com/banner.png'
                    : 'Your ad copy…'
                }
                {...register('content')}
                aria-invalid={!!errors.content}
              />
            )}
            {errors.content && (
              <p className="text-xs text-destructive">
                {errors.content.message}
              </p>
            )}
            {type === 'image' && (
              <p className="text-xs text-muted-foreground">
                Image content must be an http(s) URL.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(v) =>
                  setValue('frequency', v as FormValues['frequency'], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AD_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {frequency === 'every-n-minutes' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="intervalMinutes">Interval (minutes)</Label>
                <Input
                  id="intervalMinutes"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={
                    initial.intervalMinutes ? String(initial.intervalMinutes) : ''
                  }
                  {...register('intervalMinutes', {
                    setValueAs: (v) =>
                      v === '' || v === null || v === undefined
                        ? null
                        : Number(v),
                  })}
                  aria-invalid={!!errors.intervalMinutes}
                />
                {errors.intervalMinutes && (
                  <p className="text-xs text-destructive">
                    {errors.intervalMinutes.message as string}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="alt">Image alt text</Label>
              <Input
                id="alt"
                placeholder="Describe the image"
                {...register('alt')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="linkUrl">Link URL</Label>
              <Input
                id="linkUrl"
                placeholder="https://… or /relative"
                {...register('linkUrl')}
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-muted-foreground">
              Pages to display on
            </legend>
            <div className="flex flex-wrap gap-3">
              {PAGES.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 text-sm"
                  htmlFor={`page-${p}`}
                >
                  <Checkbox
                    id={`page-${p}`}
                    checked={placements.includes(p)}
                    onCheckedChange={() => togglePlacement(p)}
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={isActive}
                onCheckedChange={(v) => setValue('isActive', v, { shouldDirty: true })}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={!!dismissible}
                onCheckedChange={(v) =>
                  setValue('dismissible', v, { shouldDirty: true })
                }
              />
              Dismissible
            </label>
          </div>
        </CardContent>

        <CardFooter className="justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/ads">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            <Save className="size-4" aria-hidden="true" />
            {mode === 'create' ? 'Create ad' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
