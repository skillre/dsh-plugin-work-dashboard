/**
 * Browser-local refresh cadence.
 *
 * The cadence is a user preference, not plugin configuration, so it lives in
 * `localStorage` under the keys the specification names and never reaches the
 * Host. This module owns the read/write/parse rules so the settings dialog and
 * the timer effect share one interpretation, and so the whole policy is
 * testable without a DOM.
 *
 * Failure policy: storage is optional. A browser with storage disabled (or a
 * quota error) must still render the console, so every write is best-effort and
 * every read falls back to the documented default: manual refresh only.
 */

import {
  CUSTOM_MINUTES_KEY,
  CUSTOM_MINUTES_MAX,
  CUSTOM_MINUTES_MIN,
  DEFAULT_CUSTOM_MINUTES,
  REFRESH_INTERVAL_KEY,
  REFRESH_INTERVALS,
  type RefreshInterval,
} from '../types.js'

/** One resolved cadence: what the timer effect needs, nothing more. */
export interface RefreshPreference {
  interval: RefreshInterval
  /** Only meaningful when `interval === 'custom'`. */
  customMinutes: number
}

/** The documented default: no automatic refresh at all. */
export const DEFAULT_PREFERENCE: RefreshPreference = { interval: 'off', customMinutes: DEFAULT_CUSTOM_MINUTES }

/** The storage face this module needs; `undefined` when unavailable. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'> | undefined

/** Resolve the browser storage without throwing when it is blocked. */
export function browserStorage(): StorageLike {
  try {
    if (typeof globalThis.localStorage === 'undefined') return undefined
    // Safari in private mode throws on the first access; probe it once.
    const probe = '__poc-console-probe__'
    globalThis.localStorage.setItem(probe, '1')
    globalThis.localStorage.getItem(probe)
    globalThis.localStorage.removeItem?.(probe)
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** Clamp a custom cadence into the supported range, rounding to a whole minute. */
export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CUSTOM_MINUTES
  return Math.min(CUSTOM_MINUTES_MAX, Math.max(CUSTOM_MINUTES_MIN, Math.round(value)))
}

/** Accept only a declared interval id; anything else is the default. */
export function parseInterval(raw: string | null | undefined): RefreshInterval {
  const value = (raw ?? '').trim()
  return (REFRESH_INTERVALS as readonly string[]).includes(value) ? (value as RefreshInterval) : DEFAULT_PREFERENCE.interval
}

/** Read the stored preference, falling back to manual-only on anything odd. */
export function readPreference(storage: StorageLike = browserStorage()): RefreshPreference {
  if (storage === undefined) return { ...DEFAULT_PREFERENCE }
  const interval = parseInterval(storage.getItem(REFRESH_INTERVAL_KEY))
  const rawMinutes = storage.getItem(CUSTOM_MINUTES_KEY)
  const parsed = rawMinutes === null ? Number.NaN : Number(rawMinutes)
  return {
    interval,
    customMinutes: Number.isFinite(parsed) ? clampMinutes(parsed) : DEFAULT_CUSTOM_MINUTES,
  }
}

/** Persist the preference; a blocked or full storage degrades silently. */
export function writePreference(preference: RefreshPreference, storage: StorageLike = browserStorage()): void {
  if (storage === undefined) return
  try {
    storage.setItem(REFRESH_INTERVAL_KEY, preference.interval)
    storage.setItem(CUSTOM_MINUTES_KEY, String(clampMinutes(preference.customMinutes)))
  } catch {
    // A read-only or full storage only costs the user the setting, not the board.
  }
}

/**
 * The timer period in milliseconds, or `null` when refresh is manual only.
 *
 * This is the single place the four cadences turn into a number, so the effect
 * and the settings dialog can never disagree about "every 10 minutes".
 */
export function intervalMs(preference: RefreshPreference): number | null {
  switch (preference.interval) {
    case 'off':
      return null
    case '10m':
      return 10 * 60_000
    case '1h':
      return 60 * 60_000
    case 'custom':
      return clampMinutes(preference.customMinutes) * 60_000
  }
}
