'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const FieldSchema = z.object({
  key: z.string().min(1, 'Key required').max(50, 'Max 50 chars'),
  value: z.string().max(500, 'Max 500 chars'),
})

const MetadataSchema = z.object({
  fields: z
    .array(FieldSchema)
    .max(20, 'Max 20 fields')
    .refine(
      (arr) => arr.every((f) => f.key.trim().length > 0),
      'Keys cannot be empty',
    ),
})

type MetadataValues = z.infer<typeof MetadataSchema>

interface MetadataField {
  key: string
  value: string
}

interface MetadataEditorProps {
  channelId: string
  initialFields: MetadataField[]
  channelName: string
}

export function MetadataEditor({
  channelId,
  initialFields,
  channelName,
}: MetadataEditorProps) {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MetadataValues>({
    resolver: zodResolver(MetadataSchema),
    defaultValues: {
      fields:
        initialFields.length > 0
          ? initialFields
          : [{ key: '', value: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  })

  async function onSubmit(values: MetadataValues) {
    const cleaned = values.fields
      .map((f) => ({ key: f.key.trim(), value: f.value }))
      .filter((f) => f.key.length > 0)
    const res = await fetch(
      `/api/user/metadata/${encodeURIComponent(channelId)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: cleaned }),
      },
    )
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(body.error || 'Failed to save metadata')
      return
    }
    toast.success('Metadata saved')
    router.push(`/watch/${encodeURIComponent(channelId)}`)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Custom metadata</CardTitle>
        <CardDescription>
          Add your own key/value notes for{' '}
          <span className="font-medium text-foreground">{channelName}</span>.
          Up to 20 fields; only visible to you.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-3">
          {errors.fields?.message && (
            <p className="text-xs text-destructive">
              {errors.fields.message as string}
            </p>
          )}
          {errors.fields?.root?.message && (
            <p className="text-xs text-destructive">
              {errors.fields.root.message as string}
            </p>
          )}

          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="flex items-start gap-2 rounded-md border bg-muted/30 p-2"
            >
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <div className="flex flex-col gap-1 sm:w-1/3">
                  <Label htmlFor={`key-${idx}`} className="sr-only">
                    Key
                  </Label>
                  <Input
                    id={`key-${idx}`}
                    placeholder="Key (e.g. quality)"
                    maxLength={50}
                    {...register(`fields.${idx}.key`)}
                  />
                  {errors.fields?.[idx]?.key && (
                    <p className="text-xs text-destructive">
                      {errors.fields[idx]?.key?.message as string}
                    </p>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Label htmlFor={`value-${idx}`} className="sr-only">
                    Value
                  </Label>
                  <Input
                    id={`value-${idx}`}
                    placeholder="Value"
                    maxLength={500}
                    {...register(`fields.${idx}.value`)}
                  />
                  {errors.fields?.[idx]?.value && (
                    <p className="text-xs text-destructive">
                      {errors.fields[idx]?.value?.message as string}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Remove field ${idx + 1}`}
                onClick={() => remove(idx)}
                disabled={fields.length === 1}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-2"
            onClick={() => append({ key: '', value: '' })}
            disabled={fields.length >= 20}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add field
            {fields.length >= 20 && (
              <span className="text-xs text-muted-foreground">(max 20)</span>
            )}
          </Button>
        </CardContent>

        <CardFooter className="justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/watch/${encodeURIComponent(channelId)}`)
            }
            className="gap-2"
          >
            <X className="size-4" aria-hidden="true" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
