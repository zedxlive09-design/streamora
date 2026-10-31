import { z } from 'zod'
import { db } from '@/lib/db'
import {
  ROLE_ADMIN,
  ROLE_SUPERADMIN,
  ROLE_USER,
  isAdmin,
  isSuperadmin,
} from '@/lib/auth'

// ─────────────────────────────────────────────────────────────
// Ad slot validation
// ─────────────────────────────────────────────────────────────

export const AD_POSITIONS = [
  'home-top',
  'home-sidebar',
  'browse-top',
  'watch-pre',
  'watch-mid',
  'footer',
] as const
export type AdPosition = (typeof AD_POSITIONS)[number]

export const AD_TYPES = ['text', 'image', 'html'] as const
export type AdType = (typeof AD_TYPES)[number]

export const AD_FREQUENCIES = [
  'every-load',
  'once-per-session',
  'every-n-minutes',
] as const
export type AdFrequency = (typeof AD_FREQUENCIES)[number]

export const PAGES = ['home', 'browse', 'watch', 'dashboard', 'all'] as const
export type PageName = (typeof PAGES)[number]

const MetadataSchema = z
  .record(z.string(), z.unknown())
  .refine((v) => {
    const keys = Object.keys(v)
    return keys.length <= 20
  }, 'metadata: max 20 keys')
  .refine((v) => {
    // If image alt / linkUrl provided, must be string.
    if (typeof v.alt !== 'undefined' && typeof v.alt !== 'string') return false
    if (typeof v.linkUrl !== 'undefined') {
      if (typeof v.linkUrl !== 'string') return false
      if (!/^https?:\/\//i.test(v.linkUrl) && !v.linkUrl.startsWith('/')) {
        return false
      }
    }
    if (typeof v.dismissible !== 'undefined' && typeof v.dismissible !== 'boolean') {
      return false
    }
    return true
  }, 'metadata: alt (string), linkUrl (http(s) or relative), dismissible (boolean) only')
  .default({})

export const AdSlotCreateSchema = z.object({
  name: z.string().min(1).max(120),
  position: z.enum(AD_POSITIONS),
  type: z.enum(AD_TYPES),
  content: z.string().min(1).max(50_000),
  frequency: z.enum(AD_FREQUENCIES).default('every-load'),
  intervalMinutes: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
  metadata: MetadataSchema,
  placements: z
    .array(z.object({ page: z.enum(PAGES) }))
    .default([{ page: 'all' }]),
})

export const AdSlotUpdateSchema = AdSlotCreateSchema.partial()

export type AdSlotCreate = z.infer<typeof AdSlotCreateSchema>
export type AdSlotUpdate = z.infer<typeof AdSlotUpdateSchema>

function refineAdSlot(
  data: { type: string; content: string; frequency: string; intervalMinutes?: number | null },
): z.ZodIssue[] | null {
  const issues: z.ZodIssue[] = []
  if (data.type === 'image' && !/^https?:\/\//i.test(data.content)) {
    issues.push({
      code: 'custom',
      path: ['content'],
      message: 'image ad content must be an http(s) URL',
    })
  }
  if (data.frequency === 'every-n-minutes' && (!data.intervalMinutes || data.intervalMinutes < 1)) {
    issues.push({
      code: 'custom',
      path: ['intervalMinutes'],
      message: 'intervalMinutes required and ≥1 when frequency=every-n-minutes',
    })
  }
  return issues.length ? issues : null
}

export function validateAdSlotCreate(input: unknown) {
  const parsed = AdSlotCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() }
  const issues = refineAdSlot(parsed.data)
  if (issues) {
    return {
      ok: false as const,
      error: { formErrors: [], fieldErrors: { _form: issues.map((i) => i.message!) } },
    }
  }
  return { ok: true as const, data: parsed.data }
}

export function validateAdSlotUpdate(input: unknown) {
  const parsed = AdSlotUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() }
  if (
    parsed.data.frequency !== undefined ||
    parsed.data.intervalMinutes !== undefined ||
    parsed.data.type !== undefined
  ) {
    const issues = refineAdSlot({
      type: parsed.data.type ?? 'text',
      content: parsed.data.content ?? '',
      frequency: parsed.data.frequency ?? 'every-load',
      intervalMinutes: parsed.data.intervalMinutes ?? null,
    })
    if (issues) {
      return {
        ok: false as const,
        error: { formErrors: [], fieldErrors: { _form: issues.map((i) => i.message!) } },
      }
    }
  }
  return { ok: true as const, data: parsed.data }
}

// ─────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────

export async function writeAudit(
  userId: string,
  action: string,
  target: string,
  metadata: Record<string, unknown> = {},
) {
  return db.auditLog.create({
    data: {
      userId,
      action,
      target,
      metadata: JSON.stringify(metadata),
    },
  })
}

// ─────────────────────────────────────────────────────────────
// User role change authorization
// ─────────────────────────────────────────────────────────────

export function canChangeRole(
  actorRole: string,
  actorId: string,
  targetCurrentRole: string,
  targetId: string,
  targetNewRole: string,
): { ok: boolean; error?: string } {
  if (actorId === targetId && targetNewRole === ROLE_USER && targetCurrentRole !== ROLE_USER) {
    return { ok: false, error: 'Cannot self-demote' }
  }
  if (targetNewRole === ROLE_SUPERADMIN) {
    if (!isSuperadmin(actorRole)) {
      return { ok: false, error: 'Only superadmin may promote to SUPERADMIN' }
    }
  }
  if (targetCurrentRole === ROLE_SUPERADMIN && targetNewRole !== ROLE_SUPERADMIN) {
    if (!isSuperadmin(actorRole)) {
      return { ok: false, error: 'Only superadmin may demote a SUPERADMIN' }
    }
  }
  if (targetNewRole === ROLE_ADMIN) {
    if (!isAdmin(actorRole)) {
      return { ok: false, error: 'Only admin/superadmin may promote to ADMIN' }
    }
  }
  if (targetNewRole === ROLE_USER && targetCurrentRole === ROLE_ADMIN) {
    if (!isSuperadmin(actorRole)) {
      return { ok: false, error: 'Only superadmin may demote an ADMIN' }
    }
  }
  return { ok: true }
}

// Re-export roles for convenience in API routes.
export { ROLE_USER, ROLE_ADMIN, ROLE_SUPERADMIN }
