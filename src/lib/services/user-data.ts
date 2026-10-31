import { db } from '@/lib/db'
import { getCatalog } from '@/lib/catalog/fetcher'

// ─────────────────────────────────────────────────────────────
// Favorites
// ─────────────────────────────────────────────────────────────

export async function listFavorites(userId: string) {
  const rows = await db.userFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  const cat = await getCatalog()
  return rows.map((f) => {
    const ch = cat.channelsById.get(f.channelId)
    return {
      channelId: f.channelId,
      name: ch?.name ?? f.channelId,
      country: ch?.country ?? null,
      addedAt: f.createdAt,
    }
  })
}

export async function addFavorite(userId: string, channelId: string) {
  return db.userFavorite.upsert({
    where: { userId_channelId: { userId, channelId } },
    update: {},
    create: { userId, channelId },
  })
}

export async function removeFavorite(userId: string, channelId: string) {
  await db.userFavorite.deleteMany({
    where: { userId, channelId },
  })
}

// ─────────────────────────────────────────────────────────────
// Watch history
// ─────────────────────────────────────────────────────────────

const HISTORY_CAP = 100

export async function listHistory(userId: string) {
  return db.userWatchHistory.findMany({
    where: { userId },
    orderBy: { watchedAt: 'desc' },
    take: HISTORY_CAP,
  })
}

export async function recordHistory(
  userId: string,
  data: { channelId: string; channelName: string; streamUrl: string },
) {
  return db.$transaction(async (tx) => {
    const created = await tx.userWatchHistory.create({ data: { ...data, userId } })
    const count = await tx.userWatchHistory.count({ where: { userId } })
    if (count > HISTORY_CAP) {
      const overflow = count - HISTORY_CAP
      const oldest = await tx.userWatchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'asc' },
        take: overflow,
        select: { id: true },
      })
      if (oldest.length > 0) {
        await tx.userWatchHistory.deleteMany({
          where: { id: { in: oldest.map((o) => o.id) } },
        })
      }
    }
    return created
  })
}

// ─────────────────────────────────────────────────────────────
// Per-channel custom metadata
// ─────────────────────────────────────────────────────────────

const MAX_FIELDS = 20
const MAX_KEY = 50
const MAX_VALUE = 500

export interface MetadataField {
  key: string
  value: string
}

export function validateMetadataFields(fields: unknown): {
  ok: boolean
  error?: string
  data?: MetadataField[]
} {
  if (!Array.isArray(fields)) return { ok: false, error: 'fields must be an array' }
  if (fields.length > MAX_FIELDS)
    return { ok: false, error: `max ${MAX_FIELDS} fields allowed` }
  for (const f of fields) {
    if (typeof f !== 'object' || f === null) return { ok: false, error: 'invalid field' }
    const { key, value } = f as { key?: unknown; value?: unknown }
    if (typeof key !== 'string' || key.length === 0 || key.length > MAX_KEY)
      return { ok: false, error: `key must be 1..${MAX_KEY} chars` }
    if (typeof value !== 'string' || value.length > MAX_VALUE)
      return { ok: false, error: `value must be ≤${MAX_VALUE} chars` }
  }
  return { ok: true, data: fields as MetadataField[] }
}

export async function getMetadata(userId: string, channelId: string) {
  const row = await db.userChannelMetadata.findUnique({
    where: { userId_channelId: { userId, channelId } },
  })
  if (!row) return null
  try {
    return JSON.parse(row.fields) as MetadataField[]
  } catch {
    return []
  }
}

export async function upsertMetadata(
  userId: string,
  channelId: string,
  fields: MetadataField[],
) {
  return db.userChannelMetadata.upsert({
    where: { userId_channelId: { userId, channelId } },
    update: { fields: JSON.stringify(fields) },
    create: { userId, channelId, fields: JSON.stringify(fields) },
  })
}

export async function deleteMetadata(userId: string, channelId: string) {
  await db.userChannelMetadata.deleteMany({ where: { userId, channelId } })
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────

const THEME_VALUES = new Set(['light', 'dark', 'system'])

export function isValidTheme(v: string): boolean {
  return THEME_VALUES.has(v)
}

export async function getProfile(userId: string) {
  const profile = await db.userProfile.findUnique({ where: { userId } })
  return (
    profile ?? {
      displayName: null,
      defaultCountry: null,
      theme: 'system',
    }
  )
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string | null; defaultCountry?: string | null; theme?: string },
) {
  const data: {
    displayName?: string | null
    defaultCountry?: string | null
    theme?: string
  } = {}
  if (patch.displayName !== undefined) {
    if (patch.displayName !== null && patch.displayName.length > 80) {
      throw new Error('displayName too long')
    }
    data.displayName = patch.displayName
  }
  if (patch.defaultCountry !== undefined) {
    if (
      patch.defaultCountry !== null &&
      !/^[A-Z]{2}$/.test(patch.defaultCountry)
    ) {
      throw new Error('defaultCountry must be ISO 3166-1 alpha-2 or null')
    }
    data.defaultCountry = patch.defaultCountry
  }
  if (patch.theme !== undefined) {
    if (!isValidTheme(patch.theme)) throw new Error('invalid theme')
    data.theme = patch.theme
  }
  return db.userProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  })
}
