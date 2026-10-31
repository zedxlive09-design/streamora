import { describe, it, expect } from 'vitest'
import {
  validateAdSlotCreate,
  validateAdSlotUpdate,
  canChangeRole,
  AD_POSITIONS,
  AD_TYPES,
  AD_FREQUENCIES,
} from '@/lib/services/admin'
import { ROLE_USER, ROLE_ADMIN, ROLE_SUPERADMIN } from '@/lib/auth'

describe('admin service — validateAdSlotCreate', () => {
  const validBase = {
    name: 'Home banner',
    position: 'home-top',
    type: 'text',
    content: 'Hello world',
    frequency: 'every-load',
    isActive: true,
  }

  it('accepts a minimal valid text ad', () => {
    const r = validateAdSlotCreate(validBase)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.name).toBe('Home banner')
      expect(r.data.placements).toEqual([{ page: 'all' }])
    }
  })

  it('rejects unknown position', () => {
    const r = validateAdSlotCreate({ ...validBase, position: 'invalid-pos' })
    expect(r.ok).toBe(false)
  })

  it('rejects unknown type', () => {
    const r = validateAdSlotCreate({ ...validBase, type: 'video' })
    expect(r.ok).toBe(false)
  })

  it('rejects image ad without http(s) URL', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      type: 'image',
      content: 'not-a-url',
    })
    expect(r.ok).toBe(false)
  })

  it('accepts image ad with https URL', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      type: 'image',
      content: 'https://cdn.example.com/banner.png',
    })
    expect(r.ok).toBe(true)
  })

  it('rejects every-n-minutes frequency without intervalMinutes', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      frequency: 'every-n-minutes',
      intervalMinutes: null,
    })
    expect(r.ok).toBe(false)
  })

  it('accepts every-n-minutes with intervalMinutes', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      frequency: 'every-n-minutes',
      intervalMinutes: 5,
    })
    expect(r.ok).toBe(true)
  })

  it('rejects content longer than 50000 chars', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      content: 'x'.repeat(50_001),
    })
    expect(r.ok).toBe(false)
  })

  it('rejects name longer than 120 chars', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      name: 'x'.repeat(121),
    })
    expect(r.ok).toBe(false)
  })

  it('rejects invalid linkUrl in metadata', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      metadata: { linkUrl: 'javascript:alert(1)' },
    })
    expect(r.ok).toBe(false)
  })

  it('accepts relative linkUrl in metadata', () => {
    const r = validateAdSlotCreate({
      ...validBase,
      metadata: { linkUrl: '/dashboard' },
    })
    expect(r.ok).toBe(true)
  })

  it('rejects more than 20 metadata keys', () => {
    const metadata: Record<string, string> = {}
    for (let i = 0; i < 21; i++) metadata[`k${i}`] = 'v'
    const r = validateAdSlotCreate({ ...validBase, metadata })
    expect(r.ok).toBe(false)
  })
})

describe('admin service — validateAdSlotUpdate', () => {
  it('accepts partial update', () => {
    const r = validateAdSlotUpdate({ isActive: false })
    expect(r.ok).toBe(true)
  })

  it('rejects invalid frequency change to every-n-minutes without interval', () => {
    const r = validateAdSlotUpdate({ frequency: 'every-n-minutes' })
    expect(r.ok).toBe(false)
  })
})

describe('admin service — canChangeRole', () => {
  const actorId = 'actor-1'
  const targetId = 'target-1'

  it('forbids self-demotion', () => {
    const r = canChangeRole(ROLE_ADMIN, actorId, ROLE_ADMIN, actorId, ROLE_USER)
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/self-demote/i)
  })

  it('allows admin to promote user to admin', () => {
    const r = canChangeRole(ROLE_ADMIN, actorId, ROLE_USER, targetId, ROLE_ADMIN)
    expect(r.ok).toBe(true)
  })

  it('forbids non-superadmin promoting to superadmin', () => {
    const r = canChangeRole(ROLE_ADMIN, actorId, ROLE_USER, targetId, ROLE_SUPERADMIN)
    expect(r.ok).toBe(false)
  })

  it('allows superadmin to promote to superadmin', () => {
    const r = canChangeRole(ROLE_SUPERADMIN, actorId, ROLE_USER, targetId, ROLE_SUPERADMIN)
    expect(r.ok).toBe(true)
  })

  it('forbids admin demoting another admin', () => {
    const r = canChangeRole(ROLE_ADMIN, actorId, ROLE_ADMIN, targetId, ROLE_USER)
    expect(r.ok).toBe(false)
  })

  it('allows superadmin to demote admin', () => {
    const r = canChangeRole(ROLE_SUPERADMIN, actorId, ROLE_ADMIN, targetId, ROLE_USER)
    expect(r.ok).toBe(true)
  })

  it('forbids non-superadmin demoting a superadmin', () => {
    const r = canChangeRole(ROLE_ADMIN, actorId, ROLE_SUPERADMIN, targetId, ROLE_ADMIN)
    expect(r.ok).toBe(false)
  })
})

describe('admin service — exported constants', () => {
  it('exposes all 6 ad positions', () => {
    expect(AD_POSITIONS).toEqual([
      'home-top',
      'home-sidebar',
      'browse-top',
      'watch-pre',
      'watch-mid',
      'footer',
    ])
  })

  it('exposes 3 ad types', () => {
    expect(AD_TYPES).toEqual(['text', 'image', 'html'])
  })

  it('exposes 3 frequencies', () => {
    expect(AD_FREQUENCIES).toEqual(['every-load', 'once-per-session', 'every-n-minutes'])
  })
})
