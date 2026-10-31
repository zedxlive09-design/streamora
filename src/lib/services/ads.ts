import { db } from '@/lib/db'
import type { AdSlot, AdPlacement } from '@prisma/client'
import type { PageName, AdPosition } from './admin'

export interface ResolvedAdSlot {
  id: string
  name: string
  position: string
  type: string
  content: string
  frequency: string
  intervalMinutes: number | null
  metadata: Record<string, unknown>
}

interface AdSlotWithPlacements extends AdSlot {
  placements: AdPlacement[]
}

// In-memory cache for ad slots (5 minute TTL).
let cache: { slots: AdSlotWithPlacements[]; at: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

async function getActiveSlots(): Promise<AdSlotWithPlacements[]> {
  const now = Date.now()
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.slots
  }
  const slots = await db.adSlot.findMany({
    where: { isActive: true },
    include: { placements: true },
  })
  cache = { slots, at: now }
  return slots
}

export async function getAdsForPage(
  page: PageName,
  position: AdPosition,
): Promise<ResolvedAdSlot[]> {
  const slots = await getActiveSlots()
  return slots
    .filter((s) => s.position === position)
    .filter((s) => {
      if (s.placements.length === 0) return true
      return s.placements.some((p) => p.page === page || p.page === 'all')
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      type: s.type,
      content: s.content,
      frequency: s.frequency,
      intervalMinutes: s.intervalMinutes,
      metadata: parseMetadata(s.metadata),
    }))
}

function parseMetadata(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw)
    if (v && typeof v === 'object') return v as Record<string, unknown>
  } catch {
    /* ignore */
  }
  return {}
}

// Helper to determine if a slot should be shown to the current user given its frequency.
// Returns true if the slot should render.
export function shouldRenderAd(
  slot: ResolvedAdSlot,
  ctx: { sessionId?: string; lastShownAt?: number },
): boolean {
  if (slot.frequency === 'every-load') return true
  if (slot.frequency === 'once-per-session') {
    // Caller should track shown ad ids in client state; default true here.
    return true
  }
  if (slot.frequency === 'every-n-minutes') {
    if (!ctx.lastShownAt) return true
    const elapsedMin = (Date.now() - ctx.lastShownAt) / 60000
    return elapsedMin >= (slot.intervalMinutes ?? 1)
  }
  return true
}
