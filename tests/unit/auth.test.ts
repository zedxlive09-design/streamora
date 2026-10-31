import { describe, it, expect } from 'vitest'
import { isAdmin, isSuperadmin, ROLE_USER, ROLE_ADMIN, ROLE_SUPERADMIN } from '@/lib/auth'

describe('auth helpers — role predicates', () => {
  it('isAdmin: only ADMIN or SUPERADMIN', () => {
    expect(isAdmin(ROLE_USER)).toBe(false)
    expect(isAdmin(ROLE_ADMIN)).toBe(true)
    expect(isAdmin(ROLE_SUPERADMIN)).toBe(true)
    expect(isAdmin(undefined)).toBe(false)
    expect(isAdmin('random')).toBe(false)
  })

  it('isSuperadmin: only SUPERADMIN', () => {
    expect(isSuperadmin(ROLE_USER)).toBe(false)
    expect(isSuperadmin(ROLE_ADMIN)).toBe(false)
    expect(isSuperadmin(ROLE_SUPERADMIN)).toBe(true)
    expect(isSuperadmin(undefined)).toBe(false)
  })
})
