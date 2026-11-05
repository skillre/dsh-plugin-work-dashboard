import { describe, expect, it } from 'vitest'
import { readPreference, writePreference, intervalMs, clampMinutes, parseInterval, DEFAULT_PREFERENCE } from '../src/client/preferences.js'
import type { StorageLike } from '../src/client/preferences.js'

/**
 * Refresh-preference tests.
 *
 * These run in Node with a fake storage: the cadence policy must be verifiable
 * without a DOM, and the four documented cadences must map to exact periods.
 */

/** An in-memory `localStorage` double. */
function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
  } as StorageLike & { data: Map<string, string> }
}

describe('defaults', () => {
  it('is manual-only with a 30-minute custom fallback', () => {
    expect(DEFAULT_PREFERENCE).toEqual({ interval: 'off', customMinutes: 30 })
    expect(intervalMs(DEFAULT_PREFERENCE)).toBeNull()
  })

  it('falls back to the default when storage is unavailable', () => {
    expect(readPreference(undefined)).toEqual(DEFAULT_PREFERENCE)
  })
})

describe('round trip', () => {
  it('persists and reads back every cadence', () => {
    const storage = fakeStorage()
    for (const interval of ['off', '10m', '1h', 'custom'] as const) {
      writePreference({ interval, customMinutes: 45 }, storage)
      expect(readPreference(storage)).toEqual({ interval, customMinutes: 45 })
    }
  })

  it('writes the documented localStorage keys', () => {
    const storage = fakeStorage()
    writePreference({ interval: '10m', customMinutes: 30 }, storage)
    expect(storage.getItem('work-dashboard.refreshInterval')).toBe('10m')
    expect(storage.getItem('work-dashboard.customMinutes')).toBe('30')
  })

  it('ignores an unknown interval id', () => {
    const storage = fakeStorage({ 'work-dashboard.refreshInterval': 'every-second' })
    expect(readPreference(storage).interval).toBe('off')
  })

  it('ignores a non-numeric custom value', () => {
    const storage = fakeStorage({ 'work-dashboard.customMinutes': 'abc' })
    expect(readPreference(storage).customMinutes).toBe(30)
  })

  it('clamps an out-of-range custom value on read', () => {
    const storage = fakeStorage({ 'work-dashboard.refreshInterval': 'custom', 'work-dashboard.customMinutes': '99999' })
    expect(readPreference(storage).customMinutes).toBe(1440)
  })

  it('survives a storage that throws on write', () => {
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
    } as unknown as StorageLike
    expect(() => writePreference({ interval: '10m', customMinutes: 30 }, storage)).not.toThrow()
  })
})

describe('intervalMs', () => {
  it('maps the four cadences to exact periods', () => {
    expect(intervalMs({ interval: 'off', customMinutes: 30 })).toBeNull()
    expect(intervalMs({ interval: '10m', customMinutes: 30 })).toBe(600_000)
    expect(intervalMs({ interval: '1h', customMinutes: 30 })).toBe(3_600_000)
    expect(intervalMs({ interval: 'custom', customMinutes: 30 })).toBe(1_800_000)
    expect(intervalMs({ interval: 'custom', customMinutes: 5 })).toBe(300_000)
  })
})

describe('parsing helpers', () => {
  it('accepts only declared interval ids', () => {
    expect(parseInterval('10m')).toBe('10m')
    expect(parseInterval(' off ')).toBe('off')
    expect(parseInterval(null)).toBe('off')
    expect(parseInterval('bogus')).toBe('off')
  })

  it('clamps minutes into the supported range', () => {
    expect(clampMinutes(0)).toBe(1)
    expect(clampMinutes(2.4)).toBe(2)
    expect(clampMinutes(-5)).toBe(1)
    expect(clampMinutes(5000)).toBe(1440)
    expect(clampMinutes(Number.NaN)).toBe(30)
  })
})
