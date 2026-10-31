import { describe, it, expect } from 'vitest'
import {
  validateMetadataFields,
  isValidTheme,
} from '@/lib/services/user-data'

describe('user-data service — validateMetadataFields', () => {
  it('accepts empty array', () => {
    expect(validateMetadataFields([]).ok).toBe(true)
  })

  it('accepts valid fields', () => {
    const r = validateMetadataFields([
      { key: 'Rating', value: '5/5' },
      { key: 'Notes', value: 'Great channel' },
    ])
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toHaveLength(2)
  })

  it('rejects more than 20 fields', () => {
    const fields = Array.from({ length: 21 }, (_, i) => ({ key: `k${i}`, value: 'v' }))
    expect(validateMetadataFields(fields).ok).toBe(false)
  })

  it('rejects key longer than 50 chars', () => {
    const r = validateMetadataFields([{ key: 'x'.repeat(51), value: 'v' }])
    expect(r.ok).toBe(false)
  })

  it('rejects empty key', () => {
    const r = validateMetadataFields([{ key: '', value: 'v' }])
    expect(r.ok).toBe(false)
  })

  it('rejects value longer than 500 chars', () => {
    const r = validateMetadataFields([{ key: 'k', value: 'x'.repeat(501) }])
    expect(r.ok).toBe(false)
  })

  it('rejects non-array input', () => {
    expect(validateMetadataFields('not array').ok).toBe(false)
    expect(validateMetadataFields(null).ok).toBe(false)
    expect(validateMetadataFields({}).ok).toBe(false)
  })

  it('rejects non-object field entries', () => {
    expect(validateMetadataFields([null, { key: 'k', value: 'v' }]).ok).toBe(false)
  })

  it('rejects non-string key', () => {
    const r = validateMetadataFields([{ key: 123, value: 'v' }])
    expect(r.ok).toBe(false)
  })
})

describe('user-data service — isValidTheme', () => {
  it('accepts light, dark, system', () => {
    expect(isValidTheme('light')).toBe(true)
    expect(isValidTheme('dark')).toBe(true)
    expect(isValidTheme('system')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isValidTheme('red')).toBe(false)
    expect(isValidTheme('')).toBe(false)
    expect(isValidTheme('LIGHT')).toBe(false)
  })
})
