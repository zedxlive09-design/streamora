import { describe, it, expect } from 'vitest'
import { shouldRenderAd } from '@/lib/services/ads'
import type { ResolvedAdSlot } from '@/lib/services/ads'

function makeSlot(overrides: Partial<ResolvedAdSlot> = {}): ResolvedAdSlot {
  return {
    id: 'ad-1',
    name: 'Test',
    position: 'home-top',
    type: 'text',
    content: 'hello',
    frequency: 'every-load',
    intervalMinutes: null,
    metadata: {},
    ...overrides,
  }
}

describe('ads service — shouldRenderAd', () => {
  it('always returns true for every-load', () => {
    expect(shouldRenderAd(makeSlot({ frequency: 'every-load' }), {})).toBe(true)
  })

  it('returns true for once-per-session by default (caller tracks)', () => {
    expect(shouldRenderAd(makeSlot({ frequency: 'once-per-session' }), {})).toBe(true)
  })

  it('returns true for every-n-minutes when never shown', () => {
    expect(
      shouldRenderAd(
        makeSlot({ frequency: 'every-n-minutes', intervalMinutes: 5 }),
        { lastShownAt: undefined },
      ),
    ).toBe(true)
  })

  it('returns false for every-n-minutes when shown too recently', () => {
    const oneMinuteAgo = Date.now() - 60_000
    expect(
      shouldRenderAd(
        makeSlot({ frequency: 'every-n-minutes', intervalMinutes: 5 }),
        { lastShownAt: oneMinuteAgo },
      ),
    ).toBe(false)
  })

  it('returns true for every-n-minutes when interval elapsed', () => {
    const tenMinutesAgo = Date.now() - 10 * 60_000
    expect(
      shouldRenderAd(
        makeSlot({ frequency: 'every-n-minutes', intervalMinutes: 5 }),
        { lastShownAt: tenMinutesAgo },
      ),
    ).toBe(true)
  })

  it('returns true when intervalMinutes is null but frequency is every-n-minutes (defensive)', () => {
    expect(
      shouldRenderAd(
        makeSlot({ frequency: 'every-n-minutes', intervalMinutes: null }),
        {},
      ),
    ).toBe(true)
  })
})
